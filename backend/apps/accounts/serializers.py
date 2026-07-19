from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, OTPVerification, School
from .utils import send_otp_email


class StudentRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'phone',
            'date_of_birth', 'subsystem', 'exam_level',
            'specialty', 'interface_language'
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'An account with this email already exists.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User(**validated_data, role='student', is_verified=False)
        user.set_password(password)
        user.save()
        otp = OTPVerification.create_for_user(user)
        try:
            send_otp_email(user, otp.otp_code)
        except Exception:
            pass
        return user


class TeacherRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'phone',
            'date_of_birth', 'institution', 'subjects_taught',
            'years_experience', 'interface_language'
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'An account with this email already exists.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User(**validated_data, role='teacher', is_verified=False, is_teacher_verified=False)
        user.set_password(password)
        user.save()
        otp = OTPVerification.create_for_user(user)
        try:
            send_otp_email(user, otp.otp_code)
        except Exception:
            pass
        return user


class OTPVerifySerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    otp_code = serializers.CharField(max_length=6)

    def validate(self, data):
        try:
            user = User.objects.get(id=data['user_id'])
            otp = OTPVerification.objects.get(user=user)
        except (User.DoesNotExist, OTPVerification.DoesNotExist):
            raise serializers.ValidationError('Invalid verification request.')
        if not otp.is_valid():
            raise serializers.ValidationError('OTP has expired. Please request a new code.')
        if otp.otp_code != data['otp_code']:
            raise serializers.ValidationError('Incorrect code. Please try again.')
        data['user'] = user
        data['otp'] = otp
        return data


class ResendOTPSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()

    def validate(self, data):
        try:
            user = User.objects.get(id=data['user_id'])
        except User.DoesNotExist:
            raise serializers.ValidationError('User not found.')
        if user.is_verified:
            raise serializers.ValidationError('Account is already verified.')
        data['user'] = user
        return data


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Incorrect email or password.')
        if not user.is_verified:
            raise serializers.ValidationError({'not_verified': True, 'user_id': str(user.id)})
        data['user'] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'role', 'subsystem', 'exam_level', 'specialty',
            'institution', 'subjects_taught', 'years_experience',
            'interface_language', 'is_verified', 'is_teacher_verified',
            'is_pro', 'pro_expiry', 'profile_photo_url', 'created_at'
        ]
        read_only_fields = [
            'id', 'email', 'role', 'is_verified', 'is_teacher_verified',
            'is_pro', 'pro_expiry', 'created_at'
        ]


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone',
            'specialty', 'exam_level', 'subsystem',
            'interface_language', 'profile_photo_url',
            'institution', 'subjects_taught', 'years_experience'
        ]
