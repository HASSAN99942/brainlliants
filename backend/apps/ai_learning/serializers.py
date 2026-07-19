from rest_framework import serializers
from .models import AISession, QuizResult


class ChatMessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['user', 'model'])
    content = serializers.CharField()


class AIChatSerializer(serializers.Serializer):
    messages = ChatMessageSerializer(many=True)
    language = serializers.ChoiceField(choices=['en', 'fr'], required=False)


class QuizResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizResult
        fields = [
            'id', 'source_type', 'ai_session', 'question',
            'total_questions', 'correct_answers', 'score_percent',
            'answers_json', 'completed_at'
        ]
        read_only_fields = ['id', 'completed_at']


class AISessionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = AISession
        fields = [
            'id', 'session_type', 'summary_output',
            'language_used', 'created_at'
        ]
