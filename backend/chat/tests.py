from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase, override_settings
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from chat.models import Message
from conversations.models import Conversation
from config.asgi import application

User = get_user_model()


class MessageApiTests(APITestCase):
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
        self.outsider = User.objects.create_user(
            username="taylor",
            email="taylor@example.com",
            password="Strong-passphrase-902!",
        )
        self.conversation = Conversation.objects.create()
        self.conversation.participants.add(self.user, self.other_user)
        self.client.force_authenticate(user=self.user)

    def test_create_message_assigns_sender_and_updates_conversation(self):
        response = self.client.post(
            f"/api/chat/{self.conversation.id}/messages/",
            {"content": "  Hello there  "},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["content"], "Hello there")
        self.assertEqual(response.data["sender"], self.user.id)
        self.assertEqual(Message.objects.count(), 1)
        self.conversation.refresh_from_db()
        self.assertIsNotNone(self.conversation.updated_at)

    def test_non_participant_cannot_read_or_send_messages(self):
        self.client.force_authenticate(user=self.outsider)

        response = self.client.get(
            f"/api/chat/{self.conversation.id}/messages/"
        )

        self.assertEqual(response.status_code, 403)

    def test_blank_message_is_rejected(self):
        response = self.client.post(
            f"/api/chat/{self.conversation.id}/messages/",
            {"content": "   "},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Message.objects.count(), 0)


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
)
class ChatWebsocketTests(TransactionTestCase):
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
        self.conversation = Conversation.objects.create()
        self.conversation.participants.add(self.user, self.other_user)

    def test_authenticated_message_is_broadcast_and_persisted(self):
        async def communicate():
            token = AccessToken.for_user(self.user)
            communicator = WebsocketCommunicator(
                application,
                f"/ws/chat/{self.conversation.id}/?token={token}",
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            await communicator.send_json_to(
                {"type": "message", "content": "Hello in real time"}
            )
            message = await communicator.receive_json_from(timeout=2)
            self.assertEqual(message["content"], "Hello in real time")
            self.assertEqual(message["sender"], self.user.id)
            await communicator.disconnect()

        async_to_sync(communicate)()
        self.assertEqual(Message.objects.count(), 1)

    def test_websocket_requires_a_valid_access_token(self):
        async def communicate():
            communicator = WebsocketCommunicator(
                application,
                f"/ws/chat/{self.conversation.id}/",
            )
            connected, _ = await communicator.connect()
            self.assertFalse(connected)

        async_to_sync(communicate)()
