from django.utils import timezone
from apps.content.models import DownloadLog

FREE_DOWNLOADS_PER_EXAM = 3


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
    if user.is_pro:
        return True
    return get_monthly_download_count(user, exam_type) < FREE_DOWNLOADS_PER_EXAM


def get_download_info(user, exam_type) -> dict:
    used = get_monthly_download_count(user, exam_type)
    return {
        'used': used,
        'limit': None if user.is_pro else FREE_DOWNLOADS_PER_EXAM,
        'is_pro': user.is_pro,
        'can_download': can_download(user, exam_type),
    }
