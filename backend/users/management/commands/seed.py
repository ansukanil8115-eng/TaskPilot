from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from tasks.models import Task, TaskPriority, TaskStatus


class Command(BaseCommand):
    help = "Seed sample users and tasks"

    def handle(self, *args, **options):
        User = get_user_model()

        admin, _ = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@example.com", "role": "ADMIN"},
        )
        if not admin.has_usable_password():
            admin.set_password("admin12345")
            admin.is_staff = True
            admin.is_superuser = True
            admin.save()

        manager, _ = User.objects.get_or_create(
            username="manager",
            defaults={"email": "manager@example.com", "role": "MANAGER"},
        )
        if not manager.has_usable_password():
            manager.set_password("manager12345")
            manager.save()

        intern, _ = User.objects.get_or_create(
            username="intern",
            defaults={"email": "intern@example.com", "role": "INTERN"},
        )
        if not intern.has_usable_password():
            intern.set_password("intern12345")
            intern.save()

        Task.objects.get_or_create(
            title="Set up project repo",
            defaults={
                "description": "Initialize backend and frontend structure",
                "status": TaskStatus.DONE,
                "deadline": date.today() - timedelta(days=1),
                "priority": TaskPriority.HIGH,
                "created_by": manager,
                "assigned_to": intern,
            },
        )
        Task.objects.get_or_create(
            title="Implement JWT auth",
            defaults={
                "description": "Login/register with role in token",
                "status": TaskStatus.IN_PROGRESS,
                "deadline": date.today(),
                "priority": TaskPriority.HIGH,
                "created_by": manager,
                "assigned_to": intern,
            },
        )
        Task.objects.get_or_create(
            title="Prepare dashboard UI",
            defaults={
                "description": "Task list + filters + progress indicator",
                "status": TaskStatus.TODO,
                "deadline": date.today() + timedelta(days=2),
                "priority": TaskPriority.MEDIUM,
                "created_by": manager,
                "assigned_to": intern,
            },
        )

        self.stdout.write(self.style.SUCCESS("Seed data created."))
        self.stdout.write("Users:")
        self.stdout.write("- admin / admin12345 (ADMIN)")
        self.stdout.write("- manager / manager12345 (MANAGER)")
        self.stdout.write("- intern / intern12345 (INTERN)")
