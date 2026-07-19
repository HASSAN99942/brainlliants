from rest_framework import serializers
from .models import CommunityGroup, CommunityMembership, GroupPost


class CommunityGroupSerializer(serializers.ModelSerializer):
    is_member = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()

    class Meta:
        model = CommunityGroup
        fields = ['id', 'name', 'description', 'exam_type', 'subject',
                  'language', 'member_count', 'is_member', 'initials']

    def get_is_member(self, obj):
        user = self.context['request'].user
        return CommunityMembership.objects.filter(group=obj, user=user).exists()

    def get_initials(self, obj):
        words = obj.name.split()
        if len(words) >= 2:
            return (words[0][0] + words[1][0]).upper()
        return obj.name[:2].upper()


class GroupPostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = GroupPost
        fields = ['id', 'author_name', 'body', 'created_at']

    def get_author_name(self, obj):
        return f'{obj.author.first_name} {obj.author.last_name[0]}.' if obj.author.last_name else obj.author.first_name
