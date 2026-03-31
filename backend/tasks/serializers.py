from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Task, TaskStatus


User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    assigned_to_username = serializers.CharField(source="assigned_to.username", read_only=True)
    is_overdue = serializers.SerializerMethodField()
    is_due_today = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "submission_notes",
            "status",
            "deadline",
            "priority",
            "created_by",
            "created_by_username",
            "assigned_to",
            "assigned_to_username",
            "submitted_at",
            "is_overdue",
            "is_due_today",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_by",)

    def get_is_overdue(self, obj: Task) -> bool:
        if not obj.deadline:
            return False
        return obj.status != "DONE" and obj.deadline < date.today()

    def get_is_due_today(self, obj: Task) -> bool:
        if not obj.deadline:
            return False
        return obj.status != "DONE" and obj.deadline == date.today()

    def validate(self, attrs):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return attrs

        role = getattr(request.user, "role", None)
        assigned_user = attrs.get("assigned_to")

        if role == "MANAGER" and assigned_user and getattr(assigned_user, "role", None) != "INTERN":
            raise serializers.ValidationError("Managers can only assign tasks to interns.")

        # Interns can only update status on their assigned tasks
        if role == "INTERN" and request.method in {"PUT", "PATCH"}:
            allowed = {"status", "submission_notes"}
            if any(k not in allowed for k in attrs.keys()):
                raise serializers.ValidationError("Interns can only update the task status and submission notes.")
            next_status = attrs.get("status")
            allowed_statuses = {TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.SUBMITTED}
            if next_status and next_status not in allowed_statuses:
                raise serializers.ValidationError(
                    "Interns can move tasks to To Do, In Progress, or Submitted only."
                )
            if attrs.get("submission_notes") and next_status not in {None, TaskStatus.SUBMITTED}:
                raise serializers.ValidationError(
                    "Submission notes can only be added when submitting the task."
                )
        return attrs

