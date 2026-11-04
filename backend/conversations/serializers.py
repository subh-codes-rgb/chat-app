from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.serializers import UserListSerializer
from chat.serializers import MessageSerializer
from .models import Conversation

User = get_user_model()


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        write_only=True,
    )
    participant_details = UserListSerializer(
        source="participants",
        many=True,
        read_only=True,
    )
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "name",
            "is_group",
            "participants",
            "participant_details",
            "last_message",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        participants = data.get("participants", [])
        request_user = self.context["request"].user

        if not participants:
            raise serializers.ValidationError(
                {"participants": "Choose at least one other participant."}
            )
        if len({user.pk for user in participants}) != len(participants):
            raise serializers.ValidationError(
                {"participants": "A participant can only be added once."}
            )
        if request_user in participants:
            raise serializers.ValidationError(
                {"participants": "You are added automatically."}
            )
        if data.get("is_group", False):
            if not data.get("name", "").strip():
                raise serializers.ValidationError(
                    {"name": "Group conversations need a name."}
                )
        elif len(participants) != 1:
            raise serializers.ValidationError(
                {"participants": "A direct conversation has one other participant."}
            )

        return data

    def get_last_message(self, conversation):
        message = conversation.messages.select_related("sender").order_by(
            "-created_at",
            "-id",
        ).first()
        return MessageSerializer(message).data if message else None
