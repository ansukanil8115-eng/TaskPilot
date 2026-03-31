from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, viewsets
from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import PermissionDenied

from .permissions import IsAdminRole, IsManagerOrAdminRole
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserManagementSerializer,
    UserSerializer,
)

from .models import PasswordResetOTP
import random

User = get_user_model()


def _email_not_configured() -> bool:
    placeholder_values = {
        "your-email@gmail.com",
        "your-16-digit-app-password",
    }
    return (
        settings.EMAIL_BACKEND != "django.core.mail.backends.smtp.EmailBackend"
        or not settings.EMAIL_HOST_USER
        or not settings.EMAIL_HOST_PASSWORD
        or settings.EMAIL_HOST_USER in placeholder_values
        or settings.EMAIL_HOST_PASSWORD in placeholder_values
    )


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ModelViewSet):

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [IsManagerOrAdminRole()]
        return [IsAdminRole()]

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return UserManagementSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)
        queryset = User.objects.order_by("username")

        if role == "MANAGER":
            return queryset.filter(role="INTERN")

        return queryset

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise PermissionDenied("You cannot delete your own admin account.")
        instance.delete()


@api_view(["POST"])
@permission_classes([AllowAny])
def send_otp(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email is required"}, status=400)

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"error": "User not found"}, status=404)

    otp = f"{random.randint(0, 999999):06d}"
    expires_at = timezone.now() + timedelta(minutes=10)
    PasswordResetOTP.objects.create(user=user, otp=otp, expires_at=expires_at)

    if _email_not_configured():
        return Response(
            {
                "error": "Email delivery is not configured correctly. Replace the placeholder Gmail address and app password in backend/.env, then restart the backend."
            },
            status=500,
        )

    try:
        send_mail(
            "TaskPilot Password Reset OTP",
            f"Your OTP is: {otp}\n\nThis code expires in 10 minutes.",
            settings.DEFAULT_FROM_EMAIL,
            [email],
        )
    except Exception:
        return Response(
            {"error": "Unable to send OTP email. Check email settings."},
            status=500,
        )

    return Response({"message": "OTP sent successfully"})


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    email = request.data.get("email")
    otp = request.data.get("otp")
    password = request.data.get("password")

    if not email or not otp or not password:
        return Response(
            {"error": "Email, OTP, and new password are required."},
            status=400,
        )

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"error": "User not found"}, status=404)

    otp_record = (
        PasswordResetOTP.objects.filter(
            user=user,
            otp=otp,
            used=False,
            expires_at__gte=timezone.now(),
        )
        .order_by("-created_at")
        .first()
    )

    if not otp_record:
        return Response(
            {"error": "Invalid or expired OTP."},
            status=400,
        )

    try:
        validate_password(password, user=user)
    except ValidationError as exc:
        return Response({"error": exc.messages}, status=400)

    user.set_password(password)
    user.save()

    otp_record.used = True
    otp_record.save()

    return Response({"message": "Password reset successful"})
