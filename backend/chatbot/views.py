from io import BytesIO

from django.http import FileResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .assistant import handle_chat_command
from .models import ChatMessage
from .serializers import ChatMessageSerializer, ChatRequestSerializer


class ChatHistoryView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatMessage.objects.filter(user=self.request.user).order_by("-created_at")

    def delete(self, request, *args, **kwargs):
        ChatMessage.objects.filter(user=request.user).delete()
        return Response({"message": "Chat history cleared."})


class ChatMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        req = ChatRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)

        recent = list(
            ChatMessage.objects.filter(user=request.user)
            .order_by("-created_at")
            .values("message", "response")[:5]
        )
        message = req.validated_data["message"]
        response = handle_chat_command(user=request.user, message=message, recent_context=recent)

        item = ChatMessage.objects.create(user=request.user, message=message, response=response)
        return Response({"response": response, "item": ChatMessageSerializer(item).data})


class ChatHistoryPdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = (
            ChatMessage.objects.filter(user=request.user)
            .order_by("created_at")
            .values_list("created_at", "message", "response")
        )

        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        y = height - 50
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, y, f"Chat History - {request.user.username}")
        y -= 30
        p.setFont("Helvetica", 10)

        for ts, msg, resp in messages:
            lines = [
                f"[{ts.strftime('%Y-%m-%d %H:%M:%S')}] You: {msg}",
                f"Bot: {resp}",
                "",
            ]
            for line in lines:
                if y < 60:
                    p.showPage()
                    y = height - 50
                    p.setFont("Helvetica", 10)
                p.drawString(50, y, (line[:120] + "…") if len(line) > 120 else line)
                y -= 14

        p.showPage()
        p.save()
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename="chat-history.pdf")

from django.shortcuts import render

# Create your views here.
