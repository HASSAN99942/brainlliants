from django.db.models import Q, Count
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import School
from .models import Enrolment
from .serializers import (
    SchoolSerializer, EnrolmentSerializer, EnrolmentRequestSerializer,
)


def _approved_count_qs(qs):
    """Annotate a School queryset with its approved-student count."""
    return qs.annotate(
        approved_count=Count('enrolments', filter=Q(enrolments__status='approved'))
    )


class SchoolSearchView(APIView):
    """GET /api/schools/search/?q=&subsystem="""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = School.objects.filter(is_active=True)

        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(name__icontains=q) | Q(city__icontains=q) | Q(region__icontains=q)
            )

        subsystem = request.query_params.get('subsystem')
        if subsystem:
            # A bilingual school is relevant to both subsystems.
            qs = qs.filter(Q(subsystem=subsystem) | Q(subsystem='bilingual'))

        qs = _approved_count_qs(qs).order_by('name')[:50]
        return Response(SchoolSerializer(qs, many=True).data)


class MyEnrolmentsView(APIView):
    """GET /api/enrolments/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enrolments = (
            Enrolment.objects
            .filter(student=request.user)
            .select_related('school')
            .order_by('-created_at')
        )
        return Response(EnrolmentSerializer(enrolments, many=True).data)


class RequestEnrolmentView(APIView):
    """POST /api/enrolments/request/  {school_id, matricule}"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EnrolmentRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        school_id = serializer.validated_data['school_id']
        matricule = serializer.validated_data['matricule']

        try:
            school = School.objects.get(id=school_id, is_active=True)
        except School.DoesNotExist:
            return Response({'error': 'School not found.'}, status=status.HTTP_404_NOT_FOUND)

        existing = Enrolment.objects.filter(student=request.user, school=school).first()
        if existing:
            if existing.status == 'approved':
                return Response(
                    {'error': 'You are already enrolled in this school.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if existing.status == 'pending':
                return Response(
                    {'error': 'You already have a pending request for this school.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Rejected -> allow a fresh attempt on the same row (student+school is unique).
            existing.matricule = matricule
            existing.status = 'pending'
            existing.created_at = timezone.now()
            existing.reviewed_at = None
            existing.reviewed_by = None
            existing.save()
            return Response(
                EnrolmentSerializer(existing).data, status=status.HTTP_201_CREATED
            )

        enrolment = Enrolment.objects.create(
            student=request.user, school=school, matricule=matricule, status='pending',
        )
        return Response(EnrolmentSerializer(enrolment).data, status=status.HTTP_201_CREATED)
