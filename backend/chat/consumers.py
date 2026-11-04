from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from chat.models import Message
from chat.serializers import MessageSerializer
from conversations.models import Conversation


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.group_name = f"conversation_{self.conversation_id}"

        if not self.scope["user"].is_authenticated:
            await self.close(code=4401)
            return
        if not await self.is_participant():
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )

    async def receive_json(self, content, **kwargs):
        if not isinstance(content, dict) or content.get("type") != "message":
            await self.send_json({"type": "error", "detail": "Unsupported event."})
            return

        message_content = content.get("content")
        if not isinstance(message_content, str):
            await self.send_json({"type": "error", "detail": "Message text is required."})
            return

        message_content = message_content.strip()
        if not message_content or len(message_content) > 2000:
            await self.send_json(
                {
                    "type": "error",
                    "detail": "Messages must contain 1 to 2000 characters.",
                }
            )
            return

        message = await self.create_message(message_content)
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "chat.message", "message": message},
        )

    async def chat_message(self, event):
        await self.send_json(event["message"])

    @database_sync_to_async
    def is_participant(self):
        return Conversation.objects.filter(
            pk=self.conversation_id,
            participants=self.scope["user"],
        ).exists()

    @database_sync_to_async
    def create_message(self, content):
        conversation = Conversation.objects.get(pk=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.scope["user"],
            content=content,
        )
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=["updated_at"])
        return dict(MessageSerializer(message).data)
