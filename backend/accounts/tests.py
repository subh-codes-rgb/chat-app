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

    def test_profile_can_be_updated_without_changing_username(self):
        user = User.objects.create_user(
            username="jamie",
            email="jamie@example.com",
            password="Strong-passphrase-902!",
        )
        self.client.force_authenticate(user=user)

        response = self.client.patch(
            "/api/accounts/me/",
            {
                "email": "new@example.com",
                "display_name": "Jamie Rivers",
                "bio": "Always up for a chat.",
                "avatar": "https://example.com/avatar.png",
                "username": "different",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.username, "jamie")
        self.assertEqual(user.email, "new@example.com")
        self.assertEqual(user.display_name, "Jamie Rivers")
        self.assertEqual(user.bio, "Always up for a chat.")

    def test_password_change_checks_current_password_and_updates_password(self):
        user = User.objects.create_user(
            username="jamie",
            email="jamie@example.com",
            password="Strong-passphrase-902!",
        )
        self.client.force_authenticate(user=user)

        rejected = self.client.post(
            "/api/accounts/password/",
            {
                "current_password": "not-the-current-password",
                "new_password": "Another-Strong-passphrase-908!",
            },
            format="json",
        )
        self.assertEqual(rejected.status_code, 400)

        response = self.client.post(
            "/api/accounts/password/",
            {
                "current_password": "Strong-passphrase-902!",
                "new_password": "Another-Strong-passphrase-908!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 204)
        user.refresh_from_db()
        self.assertTrue(user.check_password("Another-Strong-passphrase-908!"))

    def test_people_search_can_filter_to_online_users(self):
        user = User.objects.create_user(
            username="jamie",
            email="jamie@example.com",
            password="Strong-passphrase-902!",
        )
        online_user = User.objects.create_user(
            username="alex",
            email="alex@example.com",
            password="Strong-passphrase-902!",
            is_online=True,
        )
        User.objects.create_user(
            username="casey",
            email="casey@example.com",
            password="Strong-passphrase-902!",
        )
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/accounts/users/?online=true")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [online_user.id])

    def test_exact_username_search_is_ranked_before_other_matches(self):
        user = User.objects.create_user(
            username="jamie",
            email="jamie@example.com",
            password="Strong-passphrase-902!",
        )
        exact_match = User.objects.create_user(
            username="alex",
            email="alex@example.com",
            password="Strong-passphrase-902!",
        )
        for index in range(50):
            User.objects.create_user(
                username=f"{index:02d}alex-fan",
                email=f"fan{index}@example.com",
                password="Strong-passphrase-902!",
            )
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/accounts/users/?search=alex")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 50)
        self.assertEqual(response.data[0]["id"], exact_match.id)
