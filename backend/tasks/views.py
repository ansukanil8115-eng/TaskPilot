from datetime import date, datetime

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Task
from .permissions import CanAccessTask
from .serializers import TaskSerializer


User = get_user_model()


def _parse_date(value: str):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, CanAccessTask]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        qs = Task.objects.select_related("created_by", "assigned_to").all()

        if role == "INTERN":
            qs = qs.filter(assigned_to=user)

        # Search/filter params
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(title__icontains=q)

        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)

        deadline_before = self.request.query_params.get("deadline_before")
        if deadline_before:
            d = _parse_date(deadline_before)
            if d:
                qs = qs.filter(deadline__lte=d)

        deadline_after = self.request.query_params.get("deadline_after")
        if deadline_after:
            d = _parse_date(deadline_after)
            if d:
                qs = qs.filter(deadline__gte=d)

        if self.request.query_params.get("due_today") == "1":
            qs = qs.filter(deadline=date.today()).exclude(status="DONE")

        if self.request.query_params.get("overdue") == "1":
            qs = qs.filter(deadline__lt=date.today()).exclude(status="DONE")

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, "role", None)
        if role not in {"ADMIN", "MANAGER"}:
            raise PermissionDenied("Only Admin/Manager can create tasks.")
        serializer.save(created_by=user)

    def perform_update(self, serializer):
        user = self.request.user
        role = getattr(user, "role", None)
        instance = self.get_object()

        if role == "INTERN":
            if instance.assigned_to_id != user.id:
                raise PermissionDenied("Interns can only update their own assigned tasks.")
            next_status = serializer.validated_data.get("status")
            submission_notes = serializer.validated_data.get("submission_notes")
            submitted_at = instance.submitted_at
            if next_status == "SUBMITTED":
                submitted_at = timezone.now()
            elif submission_notes is not None and next_status is None:
                submitted_at = timezone.now()
            serializer.save(submitted_at=submitted_at)
            return

        serializer.save()

    @action(detail=False, methods=["get"])
    def progress(self, request):
        qs = self.get_queryset()
        total = qs.count()
        done = qs.filter(status="DONE").count()
        pct = 0 if total == 0 else int(round((done / total) * 100))
        return Response({"total": total, "done": done, "percent_completed": pct})
