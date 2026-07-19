from django.urls import path
from . import views

urlpatterns = [
    path('posts/', views.ForumPostListView.as_view()),
    path('posts/<uuid:pk>/', views.ForumPostDetailView.as_view()),
    path('posts/<uuid:pk>/replies/', views.ForumReplyCreateView.as_view()),
    path('replies/<uuid:pk>/upvote/', views.ForumReplyUpvoteView.as_view()),
    path('replies/<uuid:pk>/best/', views.MarkBestAnswerView.as_view()),
]
