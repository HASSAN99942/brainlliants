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


class ForumPostListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ForumPost.objects.select_related('author').all().order_by('-created_at')
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

    def post(self, request):
        serializer = CreatePostSerializer(data=request.data)
        if serializer.is_valid():
            post = serializer.save(author=request.user)
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
