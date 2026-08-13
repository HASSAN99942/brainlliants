from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from logging import getLogger

from .models import AISession, QuizResult
from .serializers import AIChatSerializer, QuizResultSerializer, AISessionListSerializer
from .services.gemini_service import chat, summarise_document
from .services.quota_service import can_use_ai, get_usage_info


logger = getLogger(__name__)


class AIChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not can_use_ai(request.user):
            return Response(
                {'error': 'quota_exceeded', 'message': 'Monthly AI limit reached. Upgrade to Pro for unlimited access.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AIChatSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Set language if provided
        lang = serializer.validated_data.get('language')
        if lang:
            request.user.interface_language = lang

        # Convert messages to Gemini format
        raw_messages = serializer.validated_data['messages']
        gemini_messages = [
            {'role': msg['role'], 'parts': [{'text': msg['content']}]}
            for msg in raw_messages
        ]

        try:
            reply = chat(request.user, gemini_messages)
        except Exception as e:
            return Response(
                {'error': 'ai_error', 'message': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Persist the session best-effort: a logging failure must never deny the
        # user their reply. If it ever fails we still return 200 with the answer.
        session = None
        try:
            session = AISession.objects.create(
                user=request.user,
                session_type='chat',
                messages_json=request.data.get('messages', []),
                language_used=request.user.interface_language,
            )
        except Exception:
            logger.exception('Failed to persist AI chat session')

        usage = get_usage_info(request.user)
        return Response({
            'session_id': str(session.id) if session else None,
            'reply': reply,
            'usage': usage,
        })


class SummariseView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not can_use_ai(request.user):
            return Response(
                {'error': 'quota_exceeded', 'message': 'Monthly AI limit reached. Upgrade to Pro.'},
                status=status.HTTP_403_FORBIDDEN
            )

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file type
        allowed_types = ['application/pdf', 'application/msword',
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if file.content_type not in allowed_types:
            return Response({'error': 'Only PDF and Word files are supported.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size — 20MB
        if file.size > 20 * 1024 * 1024:
            return Response({'error': 'File too large. Maximum size is 20MB.'}, status=status.HTTP_400_BAD_REQUEST)

        lang = request.data.get('language', request.user.interface_language)
        if lang:
            request.user.interface_language = lang

        try:
            file_bytes = file.read()
            result = summarise_document(request.user, file_bytes, file.content_type)
        except Exception as e:
            return Response(
                {'error': 'ai_error', 'message': f'Failed to process document: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Persist the session best-effort so a logging hiccup can never drop the
        # summarised content from the response.
        session = None
        try:
            session = AISession.objects.create(
                user=request.user,
                session_type='summarise',
                summary_output=result.get('summary', ''),
                explanation_output=result.get('explanation', ''),
                language_used=request.user.interface_language,
            )
        except Exception:
            logger.exception('Failed to persist AI summarise session')

        return Response({
            'session_id': str(session.id) if session else None,
            'summary': result.get('summary', ''),
            'explanation': result.get('explanation', ''),
            'questions': result.get('questions', []),
        })


class QuizResultView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()
        data['user'] = request.user.id

        required = ['total_questions', 'correct_answers', 'score_percent', 'source_type']
        for field in required:
            if field not in data:
                return Response({'error': f'{field} is required.'}, status=status.HTTP_400_BAD_REQUEST)

        result = QuizResult.objects.create(
            user=request.user,
            source_type=data['source_type'],
            ai_session_id=data.get('ai_session_id'),
            question_id=data.get('question_id'),
            total_questions=data['total_questions'],
            correct_answers=data['correct_answers'],
            score_percent=data['score_percent'],
            answers_json=data.get('answers_json', []),
        )

        return Response({
            'id': str(result.id),
            'score_percent': str(result.score_percent),
        }, status=status.HTTP_201_CREATED)


class AIUsageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_usage_info(request.user))


class AISessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = AISession.objects.filter(
            user=request.user,
            session_type__in=['summarise', 'quiz_gen']
        ).order_by('-created_at')[:20]
        serializer = AISessionListSerializer(sessions, many=True)
        return Response(serializer.data)
