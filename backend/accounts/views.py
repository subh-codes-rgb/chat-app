from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import RegisterSerializer, UserListSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class UserListView(generics.ListAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        search = self.request.query_params.get("search", "").strip()
        users = User.objects.exclude(id=self.request.user.id)

        if search:
            users = users.filter(
                Q(username__icontains=search)
                | Q(display_name__icontains=search)
            )

        return users.order_by("username")[:50]


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
