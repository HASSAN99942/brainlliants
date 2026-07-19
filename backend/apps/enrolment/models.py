import uuid
from django.db import models
from apps.accounts.models import User, School


class Enrolment(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrolments')
    school      = models.ForeignKey(School, on_delete=models.CASCADE, related_name='enrolments')
    matricule   = models.CharField(max_length=100)
    STATUS = [('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')]
    status      = models.CharField(max_length=20, choices=STATUS, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_enrolments')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'enrolments'
        unique_together = [['student', 'school']]
        indexes = [models.Index(fields=['status'])]


class ClassGroup(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school       = models.ForeignKey(School, on_delete=models.CASCADE, related_name='class_groups')
    name         = models.CharField(max_length=200)
    description  = models.TextField(blank=True)
    academic_year = models.CharField(max_length=20, blank=True)
    created_by   = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'class_groups'


class ClassMembership(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_group = models.ForeignKey(ClassGroup, on_delete=models.CASCADE, related_name='memberships')
    student     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='class_memberships')
    added_by    = models.ForeignKey(User, on_delete=models.PROTECT, related_name='added_memberships')
    added_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'class_memberships'
        unique_together = [['class_group', 'student']]
