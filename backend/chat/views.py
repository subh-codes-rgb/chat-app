
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone

from .models import Message
from conversations.models import Conversation
from .serializers import MessageSerializer


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_conversation(self):
        conversation_id = self.kwargs["conversation_id"]

        try:
            return Conversation.objects.get(
                id=conversation_id,
                participants=self.request.user
            )
        except Conversation.DoesNotExist:
            raise PermissionDenied(
                "You are not a participant in this conversation."
            )

    def get_queryset(self):
        conversation = self.get_conversation()

        return Message.objects.filter(
            conversation=conversation
        ).select_related("sender").order_by("created_at")

    def perform_create(self, serializer):
        conversation = self.get_conversation()

        serializer.save(
            conversation=conversation,
            sender=self.request.user
        )
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=["updated_at"])
