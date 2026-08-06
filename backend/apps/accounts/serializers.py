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
            'specialty', 'specialty_ref', 'interface_language'
        ]
        extra_kwargs = {
            # Optional: null when the student typed their own under "Other".
            'specialty_ref': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'An account with this email already exists.'})

        # A listed specialty is the source of truth for the display string, so a
        # mismatched or missing `specialty` can never disagree with the FK.
        ref = data.get('specialty_ref')
        if ref is not None:
            data['specialty'] = ref.name
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
            'role', 'subsystem', 'exam_level', 'specialty', 'specialty_ref',
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
            'specialty', 'specialty_ref', 'exam_level', 'subsystem',
            'interface_language', 'profile_photo_url',
            'institution', 'subjects_taught', 'years_experience'
        ]
        extra_kwargs = {
            'specialty_ref': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        """Keep `specialty` and `specialty_ref` from ever disagreeing."""
        if 'specialty_ref' in data:
            ref = data['specialty_ref']
            if ref is not None:
                # A listed specialty owns the display string.
                data['specialty'] = ref.name
        elif 'specialty' in data:
            # A free-typed specialty means they are no longer on a listed one,
            # so the old link must go with it.
            data['specialty_ref'] = None

        # Moving exam or subsystem can orphan the link. Drop the structural
        # reference but keep the visible string, which is the student's to edit.
        current = self.instance
        exam = data.get('exam_level', getattr(current, 'exam_level', None))
        subsystem = data.get('subsystem', getattr(current, 'subsystem', None))
        ref = data.get('specialty_ref', getattr(current, 'specialty_ref', None))
        if ref is not None:
            covers_exam = exam in (ref.exam_levels or [])
            covers_subsystem = ref.subsystem in (subsystem, 'bilingual')
            if not (covers_exam and covers_subsystem):
                data['specialty_ref'] = None

        return data
