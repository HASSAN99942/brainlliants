import uuid
from django.db import models
from apps.accounts.models import User


class Subscription(models.Model):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user             = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    PLAN = [('free', 'Free'), ('pro', 'Pro')]
    plan             = models.CharField(max_length=10, choices=PLAN)
    METHOD = [('mtn_momo', 'MTN MoMo'), ('orange_money', 'Orange Money')]
    payment_method   = models.CharField(max_length=20, choices=METHOD, null=True, blank=True)
    amount_xaf       = models.IntegerField(null=True, blank=True)
    campay_reference = models.CharField(max_length=200, unique=True, null=True, blank=True)
    STATUS = [('pending', 'Pending'), ('active', 'Active'), ('expired', 'Expired'), ('failed', 'Failed')]
    status           = models.CharField(max_length=20, choices=STATUS, default='pending')
    start_date       = models.DateField(null=True, blank=True)
    end_date         = models.DateField(null=True, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subscriptions'
        indexes = [models.Index(fields=['user', 'status', 'end_date'])]
