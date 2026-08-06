from django.conf import settings
from django.utils import timezone
from apps.content.models import DownloadLog

FREE_DOWNLOADS_PER_EXAM = 3


def limits_apply(user) -> bool:
    """False when the caps should be ignored entirely.

    Pro users are always unlimited. Everyone is unlimited while
    settings.PAYMENTS_ENABLED is off, because there is no way to upgrade.
    """
    if user.is_pro:
        return False
    return settings.PAYMENTS_ENABLED


def get_monthly_download_count(user, exam_type) -> int:
    """Count this month's downloads for one exam type (questions + notes)."""
    now = timezone.now()
    return DownloadLog.objects.filter(
        user=user,
        downloaded_at__year=now.year,
        downloaded_at__month=now.month,
    ).filter(
        models_q_for_exam(exam_type)
    ).count()


def models_q_for_exam(exam_type):
    from django.db.models import Q
    return Q(question__exam_type=exam_type) | Q(note__exam_type=exam_type)


def can_download(user, exam_type) -> bool:
    if not limits_apply(user):
        return True
    return get_monthly_download_count(user, exam_type) < FREE_DOWNLOADS_PER_EXAM


def get_download_info(user, exam_type) -> dict:
    used = get_monthly_download_count(user, exam_type)
    capped = limits_apply(user)
    # limit=None means "unlimited" to the clients, same as a Pro user.
    return {
        'used': used,
        'limit': FREE_DOWNLOADS_PER_EXAM if capped else None,
        'is_pro': user.is_pro,
        'can_download': can_download(user, exam_type),
    }
