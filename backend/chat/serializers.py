
from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(
        source="sender.username",
        read_only=True
    )
    sender_display_name = serializers.CharField(
        source="sender.display_name",
        read_only=True,
    )

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_username",
            "sender_display_name",
            "content",
            "created_at",
            "is_read",
        ]

        read_only_fields = [
            "id",
            "conversation",
            "sender",
            "sender_username",
            "sender_display_name",
            "created_at",
            "is_read",
        ]

    def validate_content(self, value):
        content = value.strip()
        if not content:
            raise serializers.ValidationError("Message cannot be empty.")
        if len(content) > 2000:
            raise serializers.ValidationError(
                "Messages must be 2000 characters or fewer."
            )
        return content
