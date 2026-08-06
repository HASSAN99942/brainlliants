from django.urls import path
from . import views

urlpatterns = [
    path('specialties/', views.SpecialtyListView.as_view()),
    path('browse/exams/', views.BrowseExamsView.as_view()),
    path('browse/specialties/', views.BrowseSpecialtiesView.as_view()),
    path('browse/years/', views.BrowseYearsView.as_view()),
    path('questions/', views.QuestionListView.as_view()),
    path('questions/<uuid:pk>/', views.QuestionDetailView.as_view()),
    path('questions/<uuid:pk>/download/', views.QuestionDownloadView.as_view()),
    path('notes/', views.NoteListView.as_view()),
    path('notes/<uuid:pk>/download/', views.NoteDownloadView.as_view()),
    path('bookmarks/', views.BookmarkListView.as_view()),
    path('bookmarks/toggle/', views.BookmarkToggleView.as_view()),
]
