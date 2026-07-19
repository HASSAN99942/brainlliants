import uuid
from django.db import models
from apps.accounts.models import User, School

EXAM_CHOICES = [
    ('GCE_OL', 'GCE O/L'), ('GCE_AL', 'GCE A/L'),
    ('BAC_A', 'BAC A'), ('BAC_C', 'BAC C'), ('BAC_D', 'BAC D'),
    ('BAC_E', 'BAC E'), ('BAC_TECH', 'BAC Technique'),
    ('BEPC', 'BEPC'), ('PROBATOIRE', 'Probatoire'), ('HND', 'HND'), ('CEP', 'CEP'),
]
LANG_CHOICES = [('en', 'English'), ('fr', 'French')]


class Question(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title        = models.CharField(max_length=300)
    exam_type    = models.CharField(max_length=20, choices=EXAM_CHOICES)
    subject      = models.CharField(max_length=100)
    specialty    = models.CharField(max_length=100, blank=True)
    year         = models.SmallIntegerField()
    FORMAT = [('pdf', 'PDF'), ('json', 'JSON'), ('both', 'Both')]
    format       = models.CharField(max_length=10, choices=FORMAT)
    pdf_url      = models.TextField(null=True, blank=True)
    json_data    = models.JSONField(null=True, blank=True)
    file_size_kb = models.IntegerField(null=True, blank=True)
    language     = models.CharField(max_length=5, choices=LANG_CHOICES, default='en')
    school       = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='questions')
    is_public    = models.BooleanField(default=True)
    uploaded_by  = models.ForeignKey(User, on_delete=models.PROTECT, related_name='uploaded_questions')
    download_count = models.IntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'questions'
        indexes = [
            models.Index(fields=['exam_type', 'subject', 'year']),
            models.Index(fields=['school', 'is_public']),
        ]


class Note(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title        = models.CharField(max_length=300)
    exam_type    = models.CharField(max_length=20, choices=EXAM_CHOICES)
    subject      = models.CharField(max_length=100)
    specialty    = models.CharField(max_length=100, blank=True)
    language     = models.CharField(max_length=5, choices=LANG_CHOICES, default='en')
    pdf_url      = models.TextField()
    file_size_kb = models.IntegerField(null=True, blank=True)
    school       = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='notes')
    is_public    = models.BooleanField(default=True)
    uploaded_by  = models.ForeignKey(User, on_delete=models.PROTECT, related_name='uploaded_notes')
    download_count = models.IntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notes'


class Bookmark(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    CONTENT_TYPE = [('question', 'Question'), ('note', 'Note')]
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE)
    question     = models.ForeignKey(Question, on_delete=models.CASCADE, null=True, blank=True)
    note         = models.ForeignKey(Note, on_delete=models.CASCADE, null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookmarks'


class DownloadLog(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='download_logs')
    question      = models.ForeignKey(Question, on_delete=models.CASCADE, null=True, blank=True)
    note          = models.ForeignKey(Note, on_delete=models.CASCADE, null=True, blank=True)
    downloaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'download_logs'
