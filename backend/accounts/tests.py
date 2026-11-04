from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()


class AccountApiTests(APITestCase):
    def test_registration_hashes_password_and_returns_user(self):
        response = self.client.post(
            "/api/accounts/register/",
            {
                "username": "jamie",
                "email": "jamie@example.com",
                "display_name": "Jamie Rivers",
                "password": "Strong-passphrase-902!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="jamie")
        self.assertTrue(user.check_password("Strong-passphrase-902!"))
        self.assertNotIn("password", response.data)

    def test_login_returns_access_and_refresh_tokens(self):
        User.objects.create_user(
            username="jamie",
            email="jamie@example.com",
            password="Strong-passphrase-902!",
        )

        response = self.client.post(
            "/api/accounts/token/",
            {"username": "jamie", "password": "Strong-passphrase-902!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_profile_requires_authentication_and_returns_current_user(self):
        user = User.objects.create_user(
            username="jamie",
            email="jamie@example.com",
            password="Strong-passphrase-902!",
            display_name="Jamie Rivers",
        )

        response = self.client.get("/api/accounts/me/")
        self.assertEqual(response.status_code, 401)

        self.client.force_authenticate(user=user)
        response = self.client.get("/api/accounts/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "jamie")

    def test_user_search_excludes_current_user_and_matches_display_name(self):
        user = User.objects.create_user(
            username="jamie",
            email="jamie@example.com",
            password="Strong-passphrase-902!",
            display_name="Jamie Rivers",
        )
        matched_user = User.objects.create_user(
            username="alex",
            email="alex@example.com",
            password="Strong-passphrase-902!",
            display_name="Alex Rivers",
        )
        User.objects.create_user(
            username="casey",
            email="casey@example.com",
            password="Strong-passphrase-902!",
            display_name="Casey",
        )
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/accounts/users/?search=Rivers")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.data],
            [matched_user.id],
        )
