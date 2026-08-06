from django.urls import path

# School lookup lives with the enrolment logic (it reports enrolment counts),
# but is exposed under the /api/schools/ prefix reserved in config/urls.py.
from apps.enrolment.views import SchoolSearchView

urlpatterns = [
    path('search/', SchoolSearchView.as_view(), name='school-search'),
]
