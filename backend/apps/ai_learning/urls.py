from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.AIChatView.as_view()),
    path('summarise/', views.SummariseView.as_view()),
    path('quiz-result/', views.QuizResultView.as_view()),
    path('usage/', views.AIUsageView.as_view()),
    path('sessions/', views.AISessionListView.as_view()),
]
