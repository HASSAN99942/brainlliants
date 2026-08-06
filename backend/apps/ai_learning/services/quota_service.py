from django.conf import settings
from django.utils import timezone
from apps.ai_learning.models import AISession

FREE_MONTHLY_LIMIT = 20


def limits_apply(user) -> bool:
    """False when the caps should be ignored entirely.

    Pro users are always unlimited. Everyone is unlimited while
    settings.PAYMENTS_ENABLED is off, because there is no way to upgrade.
    """
    if user.is_pro:
        return False
    return settings.PAYMENTS_ENABLED


def get_monthly_usage(user) -> int:
    now = timezone.now()
    return AISession.objects.filter(
        user=user,
        created_at__year=now.year,
        created_at__month=now.month,
    ).count()


def can_use_ai(user) -> bool:
    if not limits_apply(user):
        return True
    return get_monthly_usage(user) < FREE_MONTHLY_LIMIT


def get_usage_info(user) -> dict:
    used = get_monthly_usage(user)
    capped = limits_apply(user)
    # limit=None already means "unlimited" to the clients (that is what Pro
    # users receive), so an uncapped free user reports the same shape.
    return {
        'used': used,
        'limit': FREE_MONTHLY_LIMIT if capped else None,
        'is_pro': user.is_pro,
        'remaining': max(0, FREE_MONTHLY_LIMIT - used) if capped else None,
    }
