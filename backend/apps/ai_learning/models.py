import uuid
from django.db import models
from apps.accounts.models import User


class AISession(models.Model):
    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user                = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_sessions')
    TYPE = [('chat', 'Chat'), ('summarise', 'Summarise'), ('quiz_gen', 'Quiz Generation')]
    session_type        = models.CharField(max_length=20, choices=TYPE)
    messages_json       = models.JSONField(null=True, blank=True)
    input_file_url      = models.TextField(null=True, blank=True)
    summary_output      = models.TextField(null=True, blank=True)
    explanation_output  = models.TextField(null=True, blank=True)
    LANG = [('en', 'English'), ('fr', 'French')]
    language_used       = models.CharField(max_length=5, choices=LANG, default='en')
    token_count         = models.IntegerField(null=True, blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_sessions'
        indexes = [models.Index(fields=['user', 'created_at'])]


class QuizResult(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user            = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_results')
    SOURCE = [('ai_generated', 'AI Generated'), ('question_bank', 'Question Bank')]
    source_type     = models.CharField(max_length=20, choices=SOURCE)
    ai_session      = models.ForeignKey(AISession, on_delete=models.CASCADE, null=True, blank=True)
    question        = models.ForeignKey('content.Question', on_delete=models.CASCADE, null=True, blank=True)
    total_questions = models.SmallIntegerField()
    correct_answers = models.SmallIntegerField()
    score_percent   = models.DecimalField(max_digits=5, decimal_places=2)
    answers_json    = models.JSONField(null=True, blank=True)
    completed_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quiz_results'
