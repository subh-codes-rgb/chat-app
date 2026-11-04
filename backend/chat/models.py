
from django.db import models
from django.conf import settings
from conversations.models import Conversation


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )

    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    is_read = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["conversation", "created_at"])]

    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]}"
