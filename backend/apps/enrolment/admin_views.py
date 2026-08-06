"""School-admin endpoints backing the Next.js web dashboard (web/).

Every view here is scoped to ``request.user.managed_school`` — a school admin can
never read or act on another school's data.
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Enrolment
from .serializers import SchoolSerializer, EnrolmentSerializer


class IsSchoolAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'school_admin'


def get_managed_school(user):
    """The School this admin manages, or None.

    ``School.admin_user`` is a OneToOneField with related_name='managed_school',
    so the reverse accessor *raises* rather than returning None when unset.
    """
    try:
        return user.managed_school
    except Exception:
        return None


class AdminSchoolView(APIView):
    """GET /api/enrolments/admin/school/"""
    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        school = get_managed_school(request.user)
        if school is None:
            return Response({'error': 'No school assigned to this admin.'},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(SchoolSerializer(school).data)


class AdminEnrolmentListView(APIView):
    """GET /api/enrolments/admin/enrolments/?status=pending|approved|rejected|all"""
    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        school = get_managed_school(request.user)
        if school is None:
            return Response({'error': 'No school assigned to this admin.'},
                            status=status.HTTP_404_NOT_FOUND)

        status_filter = request.query_params.get('status', 'pending')
        enrolments = Enrolment.objects.filter(school=school)
        if status_filter != 'all':
            valid = dict(Enrolment.STATUS).keys()
            if status_filter not in valid:
                return Response({'error': 'Invalid status filter.'},
                                status=status.HTTP_400_BAD_REQUEST)
            enrolments = enrolments.filter(status=status_filter)

        enrolments = enrolments.select_related('student', 'school').order_by('-created_at')
        return Response(EnrolmentSerializer(enrolments, many=True).data)


class AdminReviewEnrolmentView(APIView):
    """POST /api/enrolments/admin/enrolments/<uuid:pk>/review/  {action}"""
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        action = request.data.get('action')
        if action not in ['approve', 'reject']:
            return Response({'error': 'action must be approve or reject.'},
                            status=status.HTTP_400_BAD_REQUEST)

        school = get_managed_school(request.user)
        if school is None:
            return Response({'error': 'No school assigned to this admin.'},
                            status=status.HTTP_404_NOT_FOUND)

        try:
            enrolment = Enrolment.objects.select_related('student', 'school').get(
                pk=pk, school=school,
            )
        except Enrolment.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        enrolment.status = 'approved' if action == 'approve' else 'rejected'
        enrolment.reviewed_at = timezone.now()
        enrolment.reviewed_by = request.user
        enrolment.save(update_fields=['status', 'reviewed_at', 'reviewed_by'])
        return Response(EnrolmentSerializer(enrolment).data)


class AdminContentListView(APIView):
    """GET /api/enrolments/admin/content/

    Read-only inventory of the school's papers and notes. Uploading stays in the
    Django admin (set is_public=False and school=<this school>).
    """
    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        school = get_managed_school(request.user)
        if school is None:
            return Response({'error': 'No school assigned to this admin.'},
                            status=status.HTTP_404_NOT_FOUND)

        from apps.content.models import Question, Note

        papers = [
            {
                'id': str(q.id), 'title': q.title, 'subject': q.subject,
                'exam_type': q.exam_type, 'year': q.year, 'is_public': q.is_public,
                'download_count': q.download_count, 'created_at': q.created_at,
            }
            for q in Question.objects.filter(school=school).order_by('-created_at')[:100]
        ]
        notes = [
            {
                'id': str(n.id), 'title': n.title, 'subject': n.subject,
                'exam_type': n.exam_type, 'is_public': n.is_public,
                'download_count': n.download_count, 'created_at': n.created_at,
            }
            for n in Note.objects.filter(school=school).order_by('-created_at')[:100]
        ]
        return Response({'papers': papers, 'notes': notes})
