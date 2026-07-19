from django.db.models import Q, F
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import CommunityGroup, CommunityMembership, GroupPost
from .serializers import CommunityGroupSerializer, GroupPostSerializer
from apps.accounts.models import User


class CommunityGroupListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = CommunityGroup.objects.all().order_by('-member_count')
        lang = request.query_params.get('language')
        if lang:
            qs = qs.filter(language=lang)
        exam = request.query_params.get('exam_type')
        if exam:
            qs = qs.filter(exam_type=exam)
        serializer = CommunityGroupSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class JoinLeaveGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            group = CommunityGroup.objects.get(pk=pk)
        except CommunityGroup.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        membership = CommunityMembership.objects.filter(group=group, user=request.user).first()
        if membership:
            membership.delete()
            CommunityGroup.objects.filter(pk=pk).update(member_count=F('member_count') - 1)
            group.refresh_from_db()
            return Response({'is_member': False, 'member_count': group.member_count})
        CommunityMembership.objects.create(group=group, user=request.user)
        CommunityGroup.objects.filter(pk=pk).update(member_count=F('member_count') + 1)
        group.refresh_from_db()
        return Response({'is_member': True, 'member_count': group.member_count})


class GroupPostListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        posts = GroupPost.objects.filter(group_id=pk).select_related('author').order_by('-created_at')
        serializer = GroupPostSerializer(posts, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        try:
            group = CommunityGroup.objects.get(pk=pk)
        except CommunityGroup.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        is_member = CommunityMembership.objects.filter(group=group, user=request.user).exists()
        if not is_member:
            return Response({'error': 'Join the group to post.'}, status=status.HTTP_403_FORBIDDEN)
        body = request.data.get('body', '').strip()
        if not body:
            return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        post = GroupPost.objects.create(group=group, author=request.user, body=body)
        return Response(GroupPostSerializer(post).data, status=status.HTTP_201_CREATED)


class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        qs = User.objects.exclude(id=request.user.id).filter(
            role__in=['student', 'teacher'], is_verified=True
        )
        if q:
            qs = qs.filter(Q(first_name__icontains=q) | Q(last_name__icontains=q))
        qs = qs[:30]
        results = [{
            'id': str(u.id),
            'display_name': f'{u.first_name} {u.last_name[0]}.' if u.last_name else u.first_name,
            'initials': f'{u.first_name[0]}{u.last_name[0]}'.upper() if u.last_name else u.first_name[0].upper(),
            'role': u.role,
            'is_teacher': u.role == 'teacher' and u.is_teacher_verified,
            'exam_level': u.get_exam_level_display() if u.exam_level else None,
            'specialty': u.specialty,
            'profile_photo_url': u.profile_photo_url,
        } for u in qs]
        return Response(results)


class UserPublicProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            u = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'id': str(u.id),
            'display_name': f'{u.first_name} {u.last_name}',
            'initials': f'{u.first_name[0]}{u.last_name[0]}'.upper() if u.last_name else u.first_name[0].upper(),
            'role': u.role,
            'is_teacher': u.role == 'teacher' and u.is_teacher_verified,
            'exam_level': u.get_exam_level_display() if u.exam_level else None,
            'specialty': u.specialty,
            'institution': u.institution,
            'profile_photo_url': u.profile_photo_url,
        })


class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from .models import ChatMessage, CommunityMembership
        is_member = CommunityMembership.objects.filter(group_id=pk, user=request.user).exists()
        if not is_member:
            return Response({'error': 'Join the group to view chat.'}, status=status.HTTP_403_FORBIDDEN)

        messages = ChatMessage.objects.filter(group_id=pk, is_deleted=False)\
            .select_related('sender').order_by('-created_at')[:50]
        results = [{
            'id': str(m.id),
            'body': m.body,
            'sender_id': str(m.sender_id),
            'sender_name': f'{m.sender.first_name} {m.sender.last_name[0]}.' if m.sender.last_name else m.sender.first_name,
            'is_teacher': m.sender.role == 'teacher' and m.sender.is_teacher_verified,
            'created_at': m.created_at.isoformat(),
        } for m in reversed(messages)]
        return Response(results)
