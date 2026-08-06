from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination

from .models import Question, Note, Bookmark, DownloadLog, Specialty
from .serializers import (
    QuestionListSerializer, QuestionDetailSerializer,
    NoteSerializer, BookmarkSerializer, SpecialtySerializer,
)
from .services.freemium_service import can_download, get_download_info
from .services.access_service import visible_content_filter
from .services.content_filter import papers_for_user, papers_by_specialty


def apply_specialty_scope(qs, request):
    """Narrow a paper queryset by ?scope= and ?specialty=.

    scope='mine' (the default) uses the student's own specialty; passing an
    explicit ?specialty= always wins, which is what the browse explorer does.
    """
    scope = request.query_params.get('scope', 'mine')
    specialty_id = request.query_params.get('specialty')
    exam = request.query_params.get('exam') or request.query_params.get('exam_type')

    if specialty_id:
        return papers_by_specialty(qs, specialty_id, exam)
    if scope == 'mine':
        return papers_for_user(qs, request.user)
    return qs


class ContentPagination(PageNumberPagination):
    page_size = 20


def apply_common_filters(qs, request):
    """Shared filter/search/order logic for questions and notes.

    Notes have no ``year`` field, so year-based filtering/ordering is applied
    only when the model actually has it (otherwise fall back to -created_at).
    """
    params = request.query_params
    field_names = {f.name for f in qs.model._meta.get_fields()}
    has_year = 'year' in field_names

    # NB: `specialty` is deliberately absent. Since the catalogue landed it means
    # a Specialty id, handled by apply_specialty_scope(); matching it against the
    # legacy free-text `specialty` column here would silently return nothing.
    for field in ['exam_type', 'subject', 'language']:
        value = params.get(field)
        if value:
            qs = qs.filter(**{f'{field}__iexact': value})
    year = params.get('year')
    if year and has_year:
        qs = qs.filter(year=year)
    search = params.get('search')
    if search:
        qs = qs.filter(Q(title__icontains=search) | Q(subject__icontains=search))

    ordering = params.get('ordering', '-year' if has_year else '-created_at')
    allowed = ['year', '-year', 'title', '-title', 'file_size_kb', '-file_size_kb', '-created_at']
    if not has_year:
        allowed = [o for o in allowed if 'year' not in o]
    qs = qs.order_by(ordering if ordering in allowed else '-created_at')
    return qs


class SpecialtyListView(APIView):
    """GET /api/content/specialties/?subsystem=&exam=

    AllowAny: the registration screen needs this before the user has a token.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Specialty.objects.all()

        subsystem = request.query_params.get('subsystem')
        if subsystem:
            # 'bilingual' rows (the national concours) belong to both subsystems.
            qs = qs.filter(Q(subsystem=subsystem) | Q(subsystem='bilingual'))

        exam = request.query_params.get('exam')
        if exam:
            # exam_levels is a JSON list; filter in Python so the behaviour is
            # identical on SQLite and PostgreSQL (JSON containment lookups are
            # not portable). The catalogue is small enough for this to be free.
            rows = [s for s in qs if exam in (s.exam_levels or [])]
        else:
            rows = list(qs)

        return Response(SpecialtySerializer(rows, many=True).data)


def _subsystem_exams(subsystem):
    """Exam codes the catalogue lists for a subsystem (bilingual counts for both)."""
    rows = Specialty.objects.filter(Q(subsystem=subsystem) | Q(subsystem='bilingual'))
    codes = set()
    for row in rows:
        codes.update(row.exam_levels or [])
    return codes


class BrowseExamsView(APIView):
    """GET /api/content/browse/exams/?subsystem= — exams that actually have papers."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subsystem = request.query_params.get('subsystem')
        if not subsystem:
            return Response({'error': 'subsystem is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Go through exam_type rather than the M2M, so untagged and general
        # papers still put their exam on the map.
        allowed = _subsystem_exams(subsystem)
        exams = (
            Question.objects
            .filter(visible_content_filter(request.user))
            .filter(exam_type__in=allowed)
            .values_list('exam_type', flat=True)
            .distinct()
        )
        return Response(sorted(set(exams)))


class BrowseSpecialtiesView(APIView):
    """GET /api/content/browse/specialties/?subsystem=&exam= — those with papers."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subsystem = request.query_params.get('subsystem')
        exam = request.query_params.get('exam')
        if not subsystem or not exam:
            return Response({'error': 'subsystem and exam are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        catalogue = [
            s for s in Specialty.objects.filter(Q(subsystem=subsystem) | Q(subsystem='bilingual'))
            if exam in (s.exam_levels or [])
        ]

        visible = Question.objects.filter(visible_content_filter(request.user))

        # A general paper belongs to every specialty of its exam, so if one
        # exists the whole list is reachable.
        if visible.filter(is_general=True, exam_type=exam).exists():
            return Response(SpecialtySerializer(catalogue, many=True).data)

        tagged = set(
            visible.filter(specialties__in=catalogue)
            .values_list('specialties__id', flat=True)
        )
        rows = [s for s in catalogue if s.id in tagged]
        return Response(SpecialtySerializer(rows, many=True).data)


class BrowseYearsView(APIView):
    """GET /api/content/browse/years/?specialty=&exam= — years with papers."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        specialty_id = request.query_params.get('specialty')
        exam = request.query_params.get('exam')
        if not specialty_id:
            return Response({'error': 'specialty is required.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Question.objects.filter(visible_content_filter(request.user))
        try:
            qs = papers_by_specialty(qs, specialty_id, exam)
        except (DjangoValidationError, ValueError):
            return Response({'error': 'Invalid specialty.'}, status=status.HTTP_400_BAD_REQUEST)

        years = qs.exclude(year__isnull=True).values_list('year', flat=True).distinct()
        return Response(sorted(set(years), reverse=True))


class QuestionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Question.objects.filter(visible_content_filter(request.user))
        qs = apply_specialty_scope(qs, request)
        qs = apply_common_filters(qs, request)
        paginator = ContentPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = QuestionListSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


class QuestionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            question = Question.objects.filter(visible_content_filter(request.user)).get(pk=pk)
        except Question.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = QuestionDetailSerializer(question, context={'request': request})
        data = serializer.data
        data['download_info'] = get_download_info(request.user, question.exam_type)
        return Response(data)


class QuestionDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            question = Question.objects.filter(visible_content_filter(request.user)).get(pk=pk)
        except Question.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Already downloaded this month? Don't double-count.
        now = timezone.now()
        already = DownloadLog.objects.filter(
            user=request.user, question=question,
            downloaded_at__year=now.year, downloaded_at__month=now.month,
        ).exists()

        if not already and not can_download(request.user, question.exam_type):
            return Response({
                'error': 'limit_reached',
                'message': 'Free download limit reached for this exam type. Upgrade to Pro for unlimited downloads.',
            }, status=status.HTTP_403_FORBIDDEN)

        if not already:
            DownloadLog.objects.create(user=request.user, question=question)
            question.download_count += 1
            question.save(update_fields=['download_count'])

        return Response({'pdf_url': question.pdf_url, 'json_data': question.json_data})


class NoteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Note.objects.filter(visible_content_filter(request.user))
        qs = apply_specialty_scope(qs, request)
        qs = apply_common_filters(qs, request)
        paginator = ContentPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = NoteSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


class NoteDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            note = Note.objects.filter(visible_content_filter(request.user)).get(pk=pk)
        except Note.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        already = DownloadLog.objects.filter(
            user=request.user, note=note,
            downloaded_at__year=now.year, downloaded_at__month=now.month,
        ).exists()

        if not already and not can_download(request.user, note.exam_type):
            return Response({
                'error': 'limit_reached',
                'message': 'Free download limit reached for this exam type. Upgrade to Pro.',
            }, status=status.HTTP_403_FORBIDDEN)

        if not already:
            DownloadLog.objects.create(user=request.user, note=note)
            note.download_count += 1
            note.save(update_fields=['download_count'])

        return Response({'pdf_url': note.pdf_url})


class BookmarkListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookmarks = Bookmark.objects.filter(user=request.user).order_by('-created_at')
        serializer = BookmarkSerializer(bookmarks, many=True, context={'request': request})
        return Response(serializer.data)


class BookmarkToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        content_type = request.data.get('content_type')
        content_id = request.data.get('id')
        if content_type not in ['question', 'note'] or not content_id:
            return Response({'error': 'content_type (question|note) and id are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        kwargs = {'user': request.user, 'content_type': content_type}
        if content_type == 'question':
            kwargs['question_id'] = content_id
        else:
            kwargs['note_id'] = content_id

        existing = Bookmark.objects.filter(**kwargs).first()
        if existing:
            existing.delete()
            return Response({'bookmarked': False})
        Bookmark.objects.create(**kwargs)
        return Response({'bookmarked': True})
