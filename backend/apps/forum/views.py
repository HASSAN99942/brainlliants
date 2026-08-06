from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q, F
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from .models import ForumPost, ForumReply, ForumUpvote
from .serializers import (
    ForumPostListSerializer, ForumPostDetailSerializer,
    CreatePostSerializer, CreateReplySerializer,
)
from .services import generate_ai_answer_async


class ForumPagination(PageNumberPagination):
    page_size = 20


VALID_SCOPES = {'general', 'exam', 'specialty'}


class ForumPostListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            ForumPost.objects
            .select_related('author', 'scope_specialty')
            .all()
            .order_by('-created_at')
        )

        scope = request.query_params.get('scope', 'general')
        if scope not in VALID_SCOPES:
            return Response({'error': f'scope must be one of {sorted(VALID_SCOPES)}.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if scope == 'general':
            qs = qs.filter(scope='general')
        elif scope == 'exam':
            exam = request.query_params.get('exam') or request.user.exam_level
            if not exam:
                return self._empty(request)
            qs = qs.filter(scope='exam', scope_exam=exam)
        else:
            specialty = request.query_params.get('specialty') or request.user.specialty_ref_id
            if not specialty:
                # The student typed their specialty by hand, so there is no room
                # to point at. An empty page beats matching orphaned posts.
                return self._empty(request)
            try:
                qs = qs.filter(scope='specialty', scope_specialty_id=specialty)
            except (DjangoValidationError, ValueError):
                return Response({'error': 'Invalid specialty.'}, status=status.HTTP_400_BAD_REQUEST)

        status_filter = request.query_params.get('filter')
        if status_filter == 'resolved':
            qs = qs.filter(is_resolved=True)
        elif status_filter == 'unanswered':
            qs = qs.filter(reply_count=0)
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(body__icontains=search))

        paginator = ForumPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ForumPostListSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    @staticmethod
    def _empty(request):
        """A well-formed empty page, so the client renders its empty state."""
        paginator = ForumPagination()
        paginator.paginate_queryset(ForumPost.objects.none(), request)
        return paginator.get_paginated_response([])

    def post(self, request):
        scope = request.data.get('scope', 'general')
        if scope not in VALID_SCOPES:
            return Response({'error': f'scope must be one of {sorted(VALID_SCOPES)}.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        extra = {}

        if scope == 'exam':
            if not user.exam_level:
                return Response(
                    {'error': 'Set your exam level in your profile before posting here.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            requested = request.data.get('scope_exam')
            if requested and str(requested) != str(user.exam_level):
                return Response({'error': 'You can only post in your own exam forum.'},
                                status=status.HTTP_403_FORBIDDEN)
            extra['scope_exam'] = user.exam_level

        elif scope == 'specialty':
            if not user.specialty_ref_id:
                return Response(
                    {'error': 'Pick your specialty from the list in your profile before posting here.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            requested = request.data.get('scope_specialty')
            if requested and str(requested) != str(user.specialty_ref_id):
                return Response({'error': 'You can only post in your own specialty forum.'},
                                status=status.HTTP_403_FORBIDDEN)
            extra['scope_specialty_id'] = user.specialty_ref_id

        serializer = CreatePostSerializer(data=request.data)
        if serializer.is_valid():
            # scope_exam / scope_specialty always come from the profile, never
            # from the payload, so a post cannot be planted in another room.
            post = serializer.save(author=request.user, scope=scope, **extra)
            generate_ai_answer_async(post.id)
            return Response(
                ForumPostListSerializer(post, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForumPostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            post = ForumPost.objects.select_related('author').get(pk=pk)
        except ForumPost.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        ForumPost.objects.filter(pk=pk).update(view_count=F('view_count') + 1)
        post.refresh_from_db()
        serializer = ForumPostDetailSerializer(post, context={'request': request})
        return Response(serializer.data)


class ForumReplyCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = ForumPost.objects.get(pk=pk)
        except ForumPost.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CreateReplySerializer(data=request.data)
        if serializer.is_valid():
            reply = serializer.save(author=request.user, post=post)
            ForumPost.objects.filter(pk=pk).update(reply_count=F('reply_count') + 1)
            from .serializers import ForumReplySerializer
            return Response(
                ForumReplySerializer(reply, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForumReplyUpvoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            reply = ForumReply.objects.get(pk=pk)
        except ForumReply.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        existing = ForumUpvote.objects.filter(user=request.user, reply=reply).first()
        if existing:
            existing.delete()
            ForumReply.objects.filter(pk=pk).update(upvote_count=F('upvote_count') - 1)
            reply.refresh_from_db()
            return Response({'user_has_upvoted': False, 'upvote_count': reply.upvote_count})
        ForumUpvote.objects.create(user=request.user, reply=reply)
        ForumReply.objects.filter(pk=pk).update(upvote_count=F('upvote_count') + 1)
        reply.refresh_from_db()
        return Response({'user_has_upvoted': True, 'upvote_count': reply.upvote_count})


class MarkBestAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            reply = ForumReply.objects.select_related('post').get(pk=pk)
        except ForumReply.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if reply.post.author_id != request.user.id:
            return Response({'error': 'Only the post author can mark the best answer.'},
                            status=status.HTTP_403_FORBIDDEN)
        ForumReply.objects.filter(post=reply.post).update(is_best_answer=False)
        reply.is_best_answer = True
        reply.save(update_fields=['is_best_answer'])
        reply.post.is_resolved = True
        reply.post.save(update_fields=['is_resolved'])
        return Response({'success': True})
