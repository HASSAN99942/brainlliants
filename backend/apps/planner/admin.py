from django.contrib import admin
from .models import Timetable, ProgressLog, FCMToken

admin.site.register(Timetable)
admin.site.register(ProgressLog)
admin.site.register(FCMToken)
