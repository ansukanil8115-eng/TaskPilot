from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Task


User = get_user_model()


class TaskRoleTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="task_admin",
            email="task_admin@example.com",
            password="adminpass123",
            role="ADMIN",
        )
        self.manager = User.objects.create_user(
            username="task_manager",
            email="task_manager@example.com",
            password="managerpass123",
            role="MANAGER",
        )
        self.intern = User.objects.create_user(
            username="task_intern",
            email="task_intern@example.com",
            password="internpass123",
            role="INTERN",
        )
        self.other_intern = User.objects.create_user(
            username="task_other_intern",
            email="task_other_intern@example.com",
            password="otherintern123",
            role="INTERN",
        )

    def test_manager_can_only_assign_tasks_to_interns(self):
        self.client.force_authenticate(self.manager)

        response = self.client.post(
            "/api/tasks/",
            {
                "title": "Invalid assignment",
                "description": "Should fail",
                "status": "TODO",
                "priority": "MEDIUM",
                "deadline": date.today().isoformat(),
                "assigned_to": self.admin.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_intern_only_sees_assigned_tasks(self):
        Task.objects.create(title="Mine", created_by=self.manager, assigned_to=self.intern)
        Task.objects.create(title="Not mine", created_by=self.manager, assigned_to=self.other_intern)
        self.client.force_authenticate(self.intern)

        response = self.client.get("/api/tasks/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["title"] for item in response.data], ["Mine"])

    def test_intern_can_submit_task_with_notes_but_not_change_title_or_mark_done(self):
        task = Task.objects.create(title="Original", created_by=self.manager, assigned_to=self.intern)
        self.client.force_authenticate(self.intern)

        ok_response = self.client.patch(
            f"/api/tasks/{task.id}/",
            {"status": "SUBMITTED", "submission_notes": "Finished implementation and uploaded final work."},
            format="json",
        )
        blocked_done_response = self.client.patch(
            f"/api/tasks/{task.id}/",
            {"status": "DONE"},
            format="json",
        )
        blocked_response = self.client.patch(
            f"/api/tasks/{task.id}/",
            {"title": "Changed"},
            format="json",
        )

        self.assertEqual(ok_response.status_code, status.HTTP_200_OK)
        self.assertEqual(ok_response.data["submission_notes"], "Finished implementation and uploaded final work.")
        self.assertIsNotNone(ok_response.data["submitted_at"])
        self.assertEqual(blocked_done_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(blocked_response.status_code, status.HTTP_400_BAD_REQUEST)
