from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from conversations.models import Conversation

User = get_user_model()


class ConversationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="jamie",
            email="jamie@example.com",
            password="Strong-passphrase-902!",
        )
        self.other_user = User.objects.create_user(
            username="alex",
            email="alex@example.com",
            password="Strong-passphrase-902!",
        )
        self.client.force_authenticate(user=self.user)

    def test_create_direct_conversation_adds_both_participants(self):
        response = self.client.post(
            "/api/conversations/",
            {"participants": [self.other_user.id], "is_group": False},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        conversation = Conversation.objects.get()
        self.assertCountEqual(
            conversation.participants.values_list("id", flat=True),
            [self.user.id, self.other_user.id],
        )
        self.assertEqual(len(response.data["participant_details"]), 2)

    def test_opening_existing_direct_conversation_does_not_duplicate_it(self):
        conversation = Conversation.objects.create()
        conversation.participants.add(self.user, self.other_user)

        response = self.client.post(
            "/api/conversations/",
            {"participants": [self.other_user.id], "is_group": False},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], conversation.id)
        self.assertEqual(Conversation.objects.count(), 1)

    def test_conversation_list_only_contains_memberships(self):
        conversation = Conversation.objects.create()
        conversation.participants.add(self.user, self.other_user)

        response = self.client.get("/api/conversations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [conversation.id])

    def test_direct_conversation_requires_exactly_one_other_participant(self):
        response = self.client.post(
            "/api/conversations/",
            {"participants": [], "is_group": False},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
