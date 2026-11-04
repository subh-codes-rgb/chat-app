
from django.contrib import admin
from django.urls import path, include


from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # User registration
    path('api/accounts/', include('accounts.urls')),

    # JWT authentication
    path(
        'api/accounts/token/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),

    path(
        'api/accounts/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),
    path(
    'api/conversations/',
    include('conversations.urls')
),
path(
    'api/chat/',
    include('chat.urls')
)
]
