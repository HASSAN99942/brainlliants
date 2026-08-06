from rest_framework import serializers
from .models import Question, Note, Bookmark, Specialty


class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = [
            'id', 'code', 'name', 'abbreviation', 'subsystem',
            'exam_levels', 'category', 'is_general',
        ]


class QuestionListSerializer(serializers.ModelSerializer):
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'title', 'exam_type', 'subject', 'specialty', 'year',
            'format', 'language', 'is_public', 'file_size_kb',
            'download_count', 'is_bookmarked', 'created_at',
        ]

    def get_is_bookmarked(self, obj):
        user = self.context['request'].user
        return Bookmark.objects.filter(user=user, question=obj).exists()


class QuestionDetailSerializer(QuestionListSerializer):
    class Meta(QuestionListSerializer.Meta):
        fields = QuestionListSerializer.Meta.fields + ['pdf_url', 'json_data']


class NoteSerializer(serializers.ModelSerializer):
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = [
            'id', 'title', 'exam_type', 'subject', 'specialty', 'language',
            'is_public', 'file_size_kb', 'pdf_url', 'download_count',
            'is_bookmarked', 'created_at',
        ]

    def get_is_bookmarked(self, obj):
        user = self.context['request'].user
        return Bookmark.objects.filter(user=user, note=obj).exists()


class BookmarkSerializer(serializers.ModelSerializer):
    question = QuestionListSerializer(read_only=True)
    note = NoteSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'content_type', 'question', 'note', 'created_at']
