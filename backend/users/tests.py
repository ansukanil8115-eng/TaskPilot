from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class UserManagementTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin_test",
            email="admin_test@example.com",
            password="adminpass123",
            role="ADMIN",
        )
        self.manager = User.objects.create_user(
            username="manager_test",
            email="manager_test@example.com",
            password="managerpass123",
            role="MANAGER",
        )
        self.intern = User.objects.create_user(
            username="intern_test",
            email="intern_test@example.com",
            password="internpass123",
            role="INTERN",
        )

    def test_admin_can_create_user_from_user_management_endpoint(self):
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            "/api/auth/users/",
            {
                "username": "new_manager",
                "email": "new_manager@example.com",
                "role": "MANAGER",
                "password": "newmanager123",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="new_manager", role="MANAGER").exists())

    def test_manager_can_only_see_interns_in_user_list(self):
        self.client.force_authenticate(self.manager)

        response = self.client.get("/api/auth/users/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["role"] for item in response.data], ["INTERN"])

    def test_manager_cannot_create_user(self):
        self.client.force_authenticate(self.manager)

        response = self.client.post(
            "/api/auth/users/",
            {
                "username": "blocked_user",
                "email": "blocked@example.com",
                "role": "INTERN",
                "password": "blockedpass123",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_registration_cannot_create_admin(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "public_admin",
                "email": "public_admin@example.com",
                "role": "ADMIN",
                "password": "publicadmin123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
