from django.urls import path

from .views import ChatHistoryPdfView, ChatHistoryView, ChatMessageView


urlpatterns = [
    path("message/", ChatMessageView.as_view(), name="chat_message"),
    path("history/", ChatHistoryView.as_view(), name="chat_history"),
    path("history/pdf/", ChatHistoryPdfView.as_view(), name="chat_history_pdf"),
]

