from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm

from .models import User


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "email", "display_name")


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {"fields": ("email", "display_name")}),
    )
    fieldsets = UserAdmin.fieldsets + (
        ("Profile", {"fields": ("display_name", "bio", "avatar")}),
        ("Presence", {"fields": ("is_online", "last_seen")}),
    )
    list_display = (
        "username",
        "email",
        "display_name",
        "is_staff",
        "is_online",
    )
    search_fields = ("username", "email", "display_name")
