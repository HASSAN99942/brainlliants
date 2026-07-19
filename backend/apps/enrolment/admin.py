from django.contrib import admin
from .models import Enrolment, ClassGroup, ClassMembership

admin.site.register(Enrolment)
admin.site.register(ClassGroup)
admin.site.register(ClassMembership)
