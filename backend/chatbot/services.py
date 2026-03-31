from datetime import date, datetime

from django.contrib.auth import get_user_model
from django.db.models import Q

from tasks.models import Task, TaskPriority, TaskStatus


User = get_user_model()


def parse_date_token(value: str):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


def parse_task_creation_command(payload: str):
    parts = [part.strip() for part in payload.split("|")]
    title = parts[0] if parts else ""
    options = {}
    for part in parts[1:]:
        if ":" not in part:
            continue
        key, value = part.split(":", 1)
        options[key.strip().lower()] = value.strip()
    return title, options


def format_summary(tasks):
    total = tasks.count()
    todo = tasks.filter(status=TaskStatus.TODO).count()
    in_progress = tasks.filter(status=TaskStatus.IN_PROGRESS).count()
    done = tasks.filter(status=TaskStatus.DONE).count()
    overdue = tasks.filter(deadline__lt=date.today()).exclude(status=TaskStatus.DONE).count()
    return (
        "Task Summary\n"
        f"- Total: {total}\n"
        f"- To Do: {todo}\n"
        f"- In Progress: {in_progress}\n"
        f"- Done: {done}\n"
        f"- Overdue: {overdue}"
    )


def format_task_list(tasks, limit=10):
    items = list(tasks[:limit])
    if not items:
        return "No tasks found."

    lines = []
    for t in items:
        deadline = t.deadline.isoformat() if t.deadline else "—"
        assigned = t.assigned_to.username if t.assigned_to else "Unassigned"
        lines.append(f"- {t.title} | {t.status} | due: {deadline} | to: {assigned}")

    if tasks.count() > limit:
        lines.append(f"(showing {limit} of {tasks.count()})")
    return "\n".join(lines)


def handle_chat_command(*, user, message: str, recent_context):
    """
    Rule-based chatbot with role-aware behavior.
    Commands:
      - add task <task name>
      - show tasks
      - show pending tasks
      - tasks due today
    """
    text = (message or "").strip()
    lower = text.lower()
    role = getattr(user, "role", None)

    # Basic help
    if lower in {"help", "/help", "commands"}:
        return (
            "Commands:\n"
            "- add task <task name>\n"
            "- show tasks\n"
            "- show pending tasks\n"
            "- tasks due today"
        )

    # Visible tasks scope
    qs = Task.objects.select_related("assigned_to", "created_by").all()
    if role == "INTERN":
        qs = qs.filter(assigned_to=user)

    if lower.startswith("add task "):
        if role not in {"ADMIN", "MANAGER"}:
            return "You don't have permission to add tasks. Ask your Manager."

        title = text[9:].strip()
        if not title:
            return "Please provide a task name, e.g. `add task Update onboarding docs`."

        task = Task.objects.create(title=title, created_by=user, status=TaskStatus.TODO)
        return f"Created task: {task.title} (id: {task.id})"

    if lower == "show tasks":
        return format_task_list(qs.order_by("-created_at"))

    if lower == "show pending tasks":
        pending = qs.filter(Q(status=TaskStatus.TODO) | Q(status=TaskStatus.IN_PROGRESS))
        return format_task_list(pending.order_by("deadline", "-created_at"))

    if lower == "tasks due today":
        due = qs.filter(deadline=date.today()).exclude(status=TaskStatus.DONE)
        return format_task_list(due.order_by("deadline", "-created_at"))

    # Simple context-aware hint (keeps the last 5 turns in mind)
    if recent_context:
        return (
            "I didn't recognize that. Type `help` for commands.\n"
            "Tip: try `show tasks` or `show pending tasks`."
        )
    return "I didn't recognize that. Type `help` for commands."

