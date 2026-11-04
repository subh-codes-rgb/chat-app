
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Conversation
from .serializers import ConversationSerializer


class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related("participants").order_by("-updated_at", "-id")

    def perform_create(self, serializer):
        conversation = serializer.save()
        conversation.participants.add(self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not serializer.validated_data.get("is_group", False):
            other_participant = serializer.validated_data["participants"][0]
            candidates = (
                Conversation.objects.filter(
                    is_group=False,
                    participants=request.user,
                )
                .filter(participants=other_participant)
                .distinct()
                .prefetch_related("participants")
            )
            expected_participants = {request.user.pk, other_participant.pk}
            existing = next(
                (
                    conversation
                    for conversation in candidates
                    if {
                        participant.pk
                        for participant in conversation.participants.all()
                    }
                    == expected_participants
                ),
                None,
            )
            if existing:
                return Response(self.get_serializer(existing).data)

        self.perform_create(serializer)
        return Response(
            self.get_serializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )
