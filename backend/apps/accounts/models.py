import uuid
import random
from datetime import timedelta

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import CustomUserManager


class User(AbstractBaseUser, PermissionsMixin):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email            = models.EmailField(unique=True)
    phone            = models.CharField(max_length=20, blank=True, null=True)
    first_name       = models.CharField(max_length=100)
    last_name        = models.CharField(max_length=100)
    date_of_birth    = models.DateField(null=True, blank=True)

    ROLE_CHOICES = [
        ('student', 'Student'), ('teacher', 'Teacher'),
        ('school_admin', 'School Admin'), ('super_admin', 'Super Admin'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')

    SUBSYSTEM_CHOICES = [('anglophone', 'Anglophone'), ('francophone', 'Francophone')]
    subsystem = models.CharField(max_length=20, choices=SUBSYSTEM_CHOICES, null=True, blank=True)

    EXAM_CHOICES = [
        ('GCE_OL', 'GCE O/L'), ('GCE_AL', 'GCE A/L'),
        ('BAC_A', 'BAC A'), ('BAC_C', 'BAC C'), ('BAC_D', 'BAC D'),
        ('BAC_E', 'BAC E'), ('BAC_TECH', 'BAC Technique'),
        ('BEPC', 'BEPC'), ('PROBATOIRE', 'Probatoire'),
        ('HND', 'HND'), ('CEP', 'CEP'),
    ]
    exam_level = models.CharField(max_length=20, choices=EXAM_CHOICES, null=True, blank=True)
    specialty  = models.CharField(max_length=100, null=True, blank=True)

    # Teacher-specific
    institution      = models.CharField(max_length=200, null=True, blank=True)
    subjects_taught  = models.JSONField(default=list, blank=True)
    years_experience = models.SmallIntegerField(null=True, blank=True)

    LANG_CHOICES = [('en', 'English'), ('fr', 'French')]
    interface_language = models.CharField(max_length=5, choices=LANG_CHOICES, default='en')

    is_verified         = models.BooleanField(default=False)
    is_teacher_verified = models.BooleanField(default=False)
    is_pro              = models.BooleanField(default=False)
    pro_expiry          = models.DateField(null=True, blank=True)
    oauth_provider      = models.CharField(max_length=50, null=True, blank=True)
    oauth_uid           = models.CharField(max_length=255, null=True, blank=True)
    profile_photo_url   = models.TextField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff  = models.BooleanField(default=False)

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    class Meta:
        db_table = 'users'
        indexes = [models.Index(fields=['role']), models.Index(fields=['is_verified'])]

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.email})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'


class School(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name          = models.CharField(max_length=255, unique=True)
    city          = models.CharField(max_length=100)
    region        = models.CharField(max_length=100, blank=True, null=True)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    admin_user    = models.OneToOneField(User, on_delete=models.PROTECT, related_name='managed_school')
    logo_url      = models.TextField(null=True, blank=True)
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'schools'

    def __str__(self):
        return self.name


class OTPVerification(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='otp')
    otp_code   = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)

    class Meta:
        db_table = 'otp_verifications'

    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at

    @classmethod
    def create_for_user(cls, user):
        cls.objects.filter(user=user).delete()
        return cls.objects.create(
            user=user,
            otp_code=cls.generate_otp(),
            expires_at=timezone.now() + timedelta(minutes=10),
        )

    def __str__(self):
        return f'OTP for {self.user.email}'
