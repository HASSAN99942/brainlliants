from rest_framework import serializers
from .models import ForumPost, ForumReply, ForumUpvote


class AuthorSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    role = serializers.CharField()
    is_teacher_verified = serializers.BooleanField()
    exam_level = serializers.CharField(allow_null=True)

    def to_representation(self, instance):
        return {
            'id': str(instance.id),
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'display_name': f'{instance.first_name} {instance.last_name[0]}.' if instance.last_name else instance.first_name,
            'role': instance.role,
            'is_teacher': instance.role == 'teacher' and instance.is_teacher_verified,
            'exam_level': instance.exam_level,
            'initials': f'{instance.first_name[0]}{instance.last_name[0]}'.upper() if instance.last_name else instance.first_name[0].upper(),
        }


class ForumReplySerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    user_has_upvoted = serializers.SerializerMethodField()

    class Meta:
        model = ForumReply
        fields = ['id', 'author', 'body', 'upvote_count', 'is_best_answer', 'user_has_upvoted', 'created_at']

    def get_user_has_upvoted(self, obj):
        user = self.context['request'].user
        return ForumUpvote.objects.filter(user=user, reply=obj).exists()


class ForumPostListSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)

    class Meta:
        model = ForumPost
        fields = ['id', 'author', 'title', 'body', 'ai_answer',
                  'view_count', 'reply_count', 'is_resolved', 'created_at']


class ForumPostDetailSerializer(ForumPostListSerializer):
    replies = serializers.SerializerMethodField()

    class Meta(ForumPostListSerializer.Meta):
        fields = ForumPostListSerializer.Meta.fields + ['replies']

    def get_replies(self, obj):
        # Best answer first, then by upvotes
        replies = obj.replies.all().order_by('-is_best_answer', '-upvote_count', 'created_at')
        return ForumReplySerializer(replies, many=True, context=self.context).data


class CreatePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForumPost
        fields = ['title', 'body']


class CreateReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = ForumReply
        fields = ['body']
