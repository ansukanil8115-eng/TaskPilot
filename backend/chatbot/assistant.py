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
    for task in items:
        deadline = task.deadline.isoformat() if task.deadline else "-"
        assigned = task.assigned_to.username if task.assigned_to else "Unassigned"
        lines.append(
            f"- {task.title} | {task.status} | priority: {task.priority} | due: {deadline} | to: {assigned}"
        )

    if tasks.count() > limit:
        lines.append(f"(showing {limit} of {tasks.count()})")
    return "\n".join(lines)


def handle_chat_command(*, user, message: str, recent_context):
    text = (message or "").strip()
    lower = text.lower()
    role = getattr(user, "role", None)

    if lower in {"help", "/help", "commands"}:
        return (
            "TaskPilot Assistant Commands:\n"
            "- add task <title> | priority:high | due:2026-04-10 | assign:username\n"
            "- show tasks\n"
            "- show pending tasks\n"
            "- tasks due today\n"
            "- show overdue tasks\n"
            "- show high priority tasks\n"
            "- task status <todo|in_progress|done>\n"
            "- summary\n"
            "- clear history"
        )

    qs = Task.objects.select_related("assigned_to", "created_by").all()
    if role == "INTERN":
        qs = qs.filter(assigned_to=user)

    if lower.startswith("add task "):
        if role not in {"ADMIN", "MANAGER"}:
            return "You don't have permission to add tasks. Ask your Manager."

        title, options = parse_task_creation_command(text[9:].strip())
        if not title:
            return (
                "Please provide a task name, e.g. "
                "`add task Update onboarding docs | priority:high | due:2026-04-10`."
            )

        priority = options.get("priority", TaskPriority.MEDIUM).upper()
        if priority not in TaskPriority.values:
            return "Priority must be one of: low, medium, high."

        deadline = None
        if "due" in options:
            deadline = parse_date_token(options["due"])
            if not deadline:
                return "Use due dates in YYYY-MM-DD format."

        assigned_to = None
        if "assign" in options:
            assigned_to = User.objects.filter(username__iexact=options["assign"]).first()
            if not assigned_to:
                return f'No user found with username "{options["assign"]}".'

        task = Task.objects.create(
            title=title,
            description=options.get("desc", ""),
            created_by=user,
            status=TaskStatus.TODO,
            priority=priority,
            deadline=deadline,
            assigned_to=assigned_to,
        )
        return (
            f"Created task: {task.title}\n"
            f"- Priority: {task.priority}\n"
            f"- Due: {task.deadline.isoformat() if task.deadline else 'Not set'}\n"
            f"- Assigned to: {task.assigned_to.username if task.assigned_to else 'Unassigned'}"
        )

    if lower == "show tasks":
        return format_task_list(qs.order_by("-created_at"))

    if lower == "show pending tasks":
        pending = qs.filter(Q(status=TaskStatus.TODO) | Q(status=TaskStatus.IN_PROGRESS))
        return format_task_list(pending.order_by("deadline", "-created_at"))

    if lower == "tasks due today":
        due = qs.filter(deadline=date.today()).exclude(status=TaskStatus.DONE)
        return format_task_list(due.order_by("deadline", "-created_at"))

    if lower == "show overdue tasks":
        overdue = qs.filter(deadline__lt=date.today()).exclude(status=TaskStatus.DONE)
        return format_task_list(overdue.order_by("deadline", "-created_at"))

    if lower == "show high priority tasks":
        important = qs.filter(priority=TaskPriority.HIGH)
        return format_task_list(important.order_by("deadline", "-created_at"))

    if lower == "summary":
        return format_summary(qs)

    if lower.startswith("task status "):
        requested = lower.replace("task status ", "", 1).strip().upper()
        aliases = {
            "TODO": TaskStatus.TODO,
            "TO DO": TaskStatus.TODO,
            "IN_PROGRESS": TaskStatus.IN_PROGRESS,
            "IN PROGRESS": TaskStatus.IN_PROGRESS,
            "DONE": TaskStatus.DONE,
        }
        mapped = aliases.get(requested)
        if not mapped:
            return "Use one of these statuses: todo, in_progress, done."
        return format_task_list(qs.filter(status=mapped).order_by("deadline", "-created_at"))

    if recent_context:
        return (
            "I didn't recognize that. Type `help` for commands.\n"
            "Tip: try `summary`, `show overdue tasks`, or "
            "`add task Launch review | priority:high`."
        )
    return "I didn't recognize that. Type `help` for commands."
