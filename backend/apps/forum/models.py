import uuid
from django.db import models
from apps.accounts.models import User


class ForumPost(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_posts')
    title       = models.CharField(max_length=400)
    body        = models.TextField()
    ai_answer   = models.TextField(null=True, blank=True)
    view_count  = models.IntegerField(default=0)
    reply_count = models.IntegerField(default=0)
    is_resolved = models.BooleanField(default=False)

    # Which room the post lives in. Existing posts stay 'general', so the
    # app-wide forum is unchanged.
    SCOPE_CHOICES = [('general', 'General'), ('exam', 'Exam'), ('specialty', 'Specialty')]
    scope           = models.CharField(max_length=12, choices=SCOPE_CHOICES, default='general')
    scope_exam      = models.CharField(max_length=20, blank=True)   # set when scope='exam'
    scope_specialty = models.ForeignKey(
        'content.Specialty', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='forum_posts',
    )

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'forum_posts'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['scope', 'scope_exam']),
        ]


class ForumReply(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post          = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name='replies')
    author        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_replies')
    body          = models.TextField()
    upvote_count  = models.IntegerField(default=0)
    is_best_answer = models.BooleanField(default=False)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'forum_replies'


class ForumUpvote(models.Model):
    id     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user   = models.ForeignKey(User, on_delete=models.CASCADE)
    reply  = models.ForeignKey(ForumReply, on_delete=models.CASCADE, related_name='upvotes')

    class Meta:
        db_table = 'forum_upvotes'
        unique_together = [['user', 'reply']]
