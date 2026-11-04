from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token):
    try:
        user_id = AccessToken(token)["user_id"]
        return User.objects.get(pk=user_id, is_active=True)
    except (KeyError, TokenError, User.DoesNotExist):
        return AnonymousUser()


class JwtAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        token = parse_qs(query_string).get("token", [None])[0]
        user = await get_user_from_token(token) if token else AnonymousUser()
        return await self.app({**scope, "user": user}, receive, send)
