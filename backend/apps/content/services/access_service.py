from apps.enrolment.models import Enrolment


def get_accessible_school_ids(user):
    """IDs of schools where the user is an approved student."""
    return list(
        Enrolment.objects.filter(student=user, status='approved')
        .values_list('school_id', flat=True)
    )


def visible_content_filter(user):
    """Q filter: public content OR private content of user's approved schools."""
    from django.db.models import Q
    school_ids = get_accessible_school_ids(user)
    return Q(is_public=True) | Q(school_id__in=school_ids)
