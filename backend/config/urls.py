from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',       include('apps.accounts.urls')),
    path('api/enrolments/', include('apps.enrolment.urls')),
    path('api/content/',    include('apps.content.urls')),
    path('api/ai/',         include('apps.ai_learning.urls')),
    path('api/forum/',      include('apps.forum.urls')),
    path('api/community/',  include('apps.community.urls')),
    path('api/planner/',    include('apps.planner.urls')),
    path('api/payments/',   include('apps.payments.urls')),
    path('api/schools/',    include('apps.accounts.school_urls')),
    path('api/schema/',     SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/',       SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
