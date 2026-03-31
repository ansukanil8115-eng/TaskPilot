from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class ChatbotRoleTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="chat_admin",
            email="chat_admin@example.com",
            password="adminpass123",
            role="ADMIN",
        )
        self.manager = User.objects.create_user(
            username="chat_manager",
            email="chat_manager@example.com",
            password="managerpass123",
            role="MANAGER",
        )

    def test_admin_can_use_chatbot(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            "/api/chat/message/",
            {"message": "help"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Commands:", response.data["response"])

    def test_admin_can_get_summary_and_clear_history(self):
        self.client.force_authenticate(self.admin)

        summary_response = self.client.post(
            "/api/chat/message/",
            {"message": "summary"},
            format="json",
        )
        clear_response = self.client.delete("/api/chat/history/")

        self.assertEqual(summary_response.status_code, status.HTTP_200_OK)
        self.assertIn("Task Summary", summary_response.data["response"])
        self.assertEqual(clear_response.status_code, status.HTTP_200_OK)
        self.assertEqual(clear_response.data["message"], "Chat history cleared.")

    def test_manager_can_use_chatbot(self):
        self.client.force_authenticate(self.manager)

        response = self.client.post(
            "/api/chat/message/",
            {"message": "help"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("TaskPilot Assistant Commands:", response.data["response"])
