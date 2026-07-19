from django.utils import timezone
from apps.ai_learning.models import AISession

FREE_MONTHLY_LIMIT = 20


def get_monthly_usage(user) -> int:
    now = timezone.now()
    return AISession.objects.filter(
        user=user,
        created_at__year=now.year,
        created_at__month=now.month,
    ).count()


def can_use_ai(user) -> bool:
    if user.is_pro:
        return True
    return get_monthly_usage(user) < FREE_MONTHLY_LIMIT


def get_usage_info(user) -> dict:
    used = get_monthly_usage(user)
    return {
        'used': used,
        'limit': FREE_MONTHLY_LIMIT if not user.is_pro else None,
        'is_pro': user.is_pro,
        'remaining': max(0, FREE_MONTHLY_LIMIT - used) if not user.is_pro else None,
    }
