from django.contrib import admin

from .models import ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "message")
    list_filter = ("created_at",)
    search_fields = ("message", "response", "user__username")
