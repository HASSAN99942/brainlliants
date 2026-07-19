from django.contrib import admin
from .models import CommunityGroup, CommunityMembership, ChatMessage, GroupPost

admin.site.register(CommunityGroup)
admin.site.register(CommunityMembership)
admin.site.register(ChatMessage)
admin.site.register(GroupPost)
