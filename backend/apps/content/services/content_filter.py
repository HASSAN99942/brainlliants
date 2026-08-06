"""Specialty-aware narrowing for the question bank.

A paper is relevant to a student when it is tagged against their specialty, or
when it is a general paper of the exam they are sitting.
"""
from django.db.models import Q


def papers_for_user(qs, user):
    """The default 'my specialty' view."""
    exam = getattr(user, 'exam_level', None)
    spec_id = getattr(user, 'specialty_ref_id', None)

    if not spec_id and not exam:
        # Nothing on the profile to narrow by.
        return qs

    if not spec_id:
        # The student typed their specialty by hand (picked "Other"), so it
        # cannot be matched against the catalogue. Their exam is still a useful
        # narrowing — better than showing only the general papers.
        return qs.filter(exam_type=exam)

    condition = Q(specialties__id=spec_id)
    if exam:
        condition |= Q(is_general=True, exam_type=exam)
    return qs.filter(condition).distinct()


def papers_by_specialty(qs, specialty_id, exam=None):
    """The browse view: one chosen specialty, plus general papers of that exam."""
    condition = Q(specialties__id=specialty_id)
    if exam:
        condition |= Q(is_general=True, exam_type=exam)
    return qs.filter(condition).distinct()
