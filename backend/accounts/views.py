from django.contrib.auth import get_user_model
from django.db.models import Case, IntegerField, Q, Value, When
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    PasswordChangeSerializer,
    ProfileSerializer,
    RegisterSerializer,
    UserListSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class UserListView(generics.ListAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        search = self.request.query_params.get("search", "").strip()
        online_only = self.request.query_params.get("online") == "true"
        users = User.objects.exclude(id=self.request.user.id)

        if search:
            users = users.filter(
                Q(username__icontains=search)
                | Q(display_name__icontains=search)
            )

        if online_only:
            users = users.filter(is_online=True)

        return users.annotate(
            exact_username=Case(
                When(username__iexact=search, then=Value(0)),
                default=Value(1),
                output_field=IntegerField(),
            )
        ).order_by("exact_username", "-is_online", "username")[:50]


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)
