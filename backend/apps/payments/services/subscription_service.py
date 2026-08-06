"""Keeps Subscription rows and the User.is_pro / pro_expiry flags in step."""
import logging
from datetime import timedelta

from django.utils import timezone

from apps.payments.models import Subscription
from .campay_service import PRO_DURATION_DAYS

logger = logging.getLogger(__name__)


def activate(subscription: Subscription) -> Subscription:
    """Mark a subscription active and grant the user Pro for 30 days."""
    today = timezone.now().date()
    subscription.status = 'active'
    subscription.plan = 'pro'
    subscription.start_date = today
    subscription.end_date = today + timedelta(days=PRO_DURATION_DAYS)
    subscription.save(update_fields=['status', 'plan', 'start_date', 'end_date'])

    user = subscription.user
    user.is_pro = True
    # Stack onto an unexpired subscription rather than truncating it.
    current = user.pro_expiry
    base = current if current and current > today else today
    user.pro_expiry = base + timedelta(days=PRO_DURATION_DAYS)
    user.save(update_fields=['is_pro', 'pro_expiry'])

    logger.info('Subscription %s active; %s is Pro until %s',
                subscription.id, user.email, user.pro_expiry)
    return subscription


def fail(subscription: Subscription) -> Subscription:
    subscription.status = 'failed'
    subscription.save(update_fields=['status'])
    return subscription


def sync_expiry(user) -> None:
    """Drop Pro once the expiry date has passed."""
    today = timezone.now().date()
    if user.is_pro and (user.pro_expiry is None or user.pro_expiry < today):
        user.is_pro = False
        user.save(update_fields=['is_pro'])
        Subscription.objects.filter(
            user=user, status='active', end_date__lt=today,
        ).update(status='expired')
        logger.info('Pro expired for %s', user.email)


def current_subscription(user):
    """The live Pro subscription for a user, or None."""
    sync_expiry(user)
    if not user.is_pro:
        return None
    return (
        Subscription.objects
        .filter(user=user, status='active')
        .order_by('-end_date', '-created_at')
        .first()
    )
