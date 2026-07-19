from django.contrib import admin
from .models import User, School, OTPVerification

admin.site.register(User)
admin.site.register(School)
admin.site.register(OTPVerification)
