import uuid
from django.db import models
from apps.accounts.models import User


class Timetable(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.OneToOneField(User, on_delete=models.CASCADE, related_name='timetable')
    entries_json = models.JSONField(default=list)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'timetables'


class ProgressLog(models.Model):
    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user              = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_logs')
    log_date          = models.DateField()
    study_minutes     = models.IntegerField(default=0)
    streak_days       = models.IntegerField(default=0)
    quizzes_completed = models.SmallIntegerField(default=0)
    ai_queries_used   = models.SmallIntegerField(default=0)

    class Meta:
        db_table = 'progress_logs'
        unique_together = [['user', 'log_date']]
        indexes = [models.Index(fields=['user', '-log_date'])]


class FCMToken(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fcm_tokens')
    token      = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fcm_tokens'
