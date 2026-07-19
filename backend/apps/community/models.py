import uuid
from django.db import models
from apps.accounts.models import User


class CommunityGroup(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name         = models.CharField(max_length=200, unique=True)
    description  = models.TextField(blank=True)
    exam_type    = models.CharField(max_length=20, null=True, blank=True)
    subject      = models.CharField(max_length=100, blank=True)
    LANG = [('en', 'English'), ('fr', 'French')]
    language     = models.CharField(max_length=5, choices=LANG, default='en')
    member_count = models.IntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'community_groups'


class CommunityMembership(models.Model):
    id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group     = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name='memberships')
    user      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='community_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'community_memberships'
        unique_together = [['group', 'user']]


class ChatMessage(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group      = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name='messages')
    sender     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    body       = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        indexes = [models.Index(fields=['group', '-created_at'])]


class GroupPost(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group      = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name='posts')
    author     = models.ForeignKey(User, on_delete=models.CASCADE)
    body       = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'group_posts'
