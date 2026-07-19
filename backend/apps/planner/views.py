from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from .models import Timetable, ProgressLog, FCMToken


class TimetableView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tt, _ = Timetable.objects.get_or_create(user=request.user)
        return Response({'entries': tt.entries_json})

    def put(self, request):
        tt, _ = Timetable.objects.get_or_create(user=request.user)
        entries = request.data.get('entries', [])
        if not isinstance(entries, list):
            return Response({'error': 'entries must be a list.'}, status=status.HTTP_400_BAD_REQUEST)
        tt.entries_json = entries
        tt.save(update_fields=['entries_json', 'updated_at'])
        return Response({'entries': tt.entries_json})


class ProgressDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        # Streak — consecutive days up to today with study_minutes > 0
        logs = {l.log_date: l for l in ProgressLog.objects.filter(user=user).order_by('-log_date')}
        streak = 0
        cursor = today
        while cursor in logs and logs[cursor].study_minutes > 0:
            streak += 1
            cursor -= timedelta(days=1)

        # Best streak
        best_streak = 0
        run = 0
        all_dates = sorted(logs.keys())
        prev = None
        for d in all_dates:
            if logs[d].study_minutes <= 0:
                run = 0
                prev = d
                continue
            if prev is not None and (d - prev).days == 1 and logs[prev].study_minutes > 0:
                run += 1
            else:
                run = 1
            best_streak = max(best_streak, run)
            prev = d

        total_minutes = sum(l.study_minutes for l in logs.values())
        total_hours = round(total_minutes / 60)

        # Quizzes this month
        from apps.ai_learning.models import QuizResult
        now = timezone.now()
        quizzes_this_month = QuizResult.objects.filter(
            user=user, completed_at__year=now.year, completed_at__month=now.month
        ).count()

        # AI usage
        from apps.ai_learning.services.quota_service import get_usage_info
        usage = get_usage_info(user)

        # Last 7 days (Mon..Sun of current week)
        weekday = today.weekday()  # Mon=0
        monday = today - timedelta(days=weekday)
        week = []
        for i in range(7):
            d = monday + timedelta(days=i)
            log = logs.get(d)
            week.append({
                'date': d.isoformat(),
                'label': ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
                'minutes': log.study_minutes if log else 0,
                'is_today': d == today,
            })

        return Response({
            'streak': streak,
            'best_streak': best_streak,
            'total_hours': total_hours,
            'quizzes_this_month': quizzes_this_month,
            'ai_used': usage['used'],
            'ai_limit': usage['limit'],
            'week': week,
        })


class LogStudySessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        minutes = request.data.get('minutes')
        if minutes is None or not isinstance(minutes, int) or minutes <= 0:
            return Response({'error': 'minutes must be a positive integer.'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        log, created = ProgressLog.objects.get_or_create(
            user=request.user, log_date=today,
            defaults={'study_minutes': 0},
        )
        log.study_minutes += minutes
        log.save(update_fields=['study_minutes'])
        return Response({'log_date': today.isoformat(), 'study_minutes': log.study_minutes})


class RegisterFCMTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        FCMToken.objects.get_or_create(user=request.user, token=token)
        return Response({'success': True})
