from django.urls import path

from . import views, admin_views

# Mounted at /api/enrolments/ by config/urls.py.
urlpatterns = [
    # Student
    path('',        views.MyEnrolmentsView.as_view(),     name='my-enrolments'),
    path('request/', views.RequestEnrolmentView.as_view(), name='request-enrolment'),

    # School admin (web dashboard)
    path('admin/school/',     admin_views.AdminSchoolView.as_view(),        name='admin-school'),
    path('admin/enrolments/', admin_views.AdminEnrolmentListView.as_view(), name='admin-enrolments'),
    path('admin/enrolments/<uuid:pk>/review/',
         admin_views.AdminReviewEnrolmentView.as_view(), name='admin-review-enrolment'),
    path('admin/content/',    admin_views.AdminContentListView.as_view(),   name='admin-content'),
]
