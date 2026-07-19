from django.urls import path
from . import views

urlpatterns = [
    path('groups/', views.CommunityGroupListView.as_view()),
    path('groups/<uuid:pk>/join/', views.JoinLeaveGroupView.as_view()),
    path('groups/<uuid:pk>/posts/', views.GroupPostListView.as_view()),
    path('groups/<uuid:pk>/chat-history/', views.ChatHistoryView.as_view()),
    path('users/search/', views.UserSearchView.as_view()),
    path('users/<uuid:pk>/', views.UserPublicProfileView.as_view()),
]
