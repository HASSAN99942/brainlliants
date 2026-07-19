from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

from .models import User, OTPVerification
from .serializers import (
    StudentRegisterSerializer, TeacherRegisterSerializer,
    OTPVerifySerializer, ResendOTPSerializer,
    LoginSerializer, UserProfileSerializer, UpdateProfileSerializer
)
from .utils import send_otp_email


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


class StudentRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user_id': str(user.id),
                'email': user.email,
                'message': 'Account created. Check your email for the verification code.'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TeacherRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TeacherRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user_id': str(user.id),
                'email': user.email,
                'message': 'Teacher account created. Check your email for the verification code.'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            otp = serializer.validated_data['otp']
            user.is_verified = True
            user.save(update_fields=['is_verified'])
            otp.is_used = True
            otp.save(update_fields=['is_used'])
            tokens = get_tokens(user)
            profile = UserProfileSerializer(user).data
            return Response({**tokens, 'user': profile}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            otp = OTPVerification.create_for_user(user)
            try:
                send_otp_email(user, otp.otp_code)
            except Exception:
                pass
            return Response({'message': 'New code sent to your email.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.last_login_at = timezone.now()
            user.save(update_fields=['last_login_at'])
            tokens = get_tokens(user)
            profile = UserProfileSerializer(user).data
            return Response({**tokens, 'user': profile}, status=status.HTTP_200_OK)
        errors = serializer.errors
        # LoginSerializer flags an unverified account by raising
        # ValidationError({'not_verified': True, 'user_id': ...}); DRF exposes
        # those as top-level keys (not under non_field_errors). Translate that
        # into a 403 the client can act on (redirect to the OTP screen) rather
        # than a generic 400.
        if 'not_verified' in errors:
            user_id = errors.get('user_id')
            return Response({
                'error': 'not_verified',
                'user_id': str(user_id[0]) if user_id else None,
                'message': 'Please verify your email first.'
            }, status=status.HTTP_403_FORBIDDEN)
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass
        return Response({'message': 'Logged out.'}, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserProfileSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangeLanguageView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        lang = request.data.get('language')
        if lang not in ['en', 'fr']:
            return Response({'error': 'Language must be en or fr.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.interface_language = lang
        request.user.save(update_fields=['interface_language'])
        return Response({'language': lang})
