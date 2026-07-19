from django.urls import path
from . import views

urlpatterns = [
    path('timetable/', views.TimetableView.as_view()),
    path('progress/', views.ProgressDashboardView.as_view()),
    path('log-session/', views.LogStudySessionView.as_view()),
    path('fcm-token/', views.RegisterFCMTokenView.as_view()),
]
