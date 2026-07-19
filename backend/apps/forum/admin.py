from django.contrib import admin
from .models import ForumPost, ForumReply, ForumUpvote

admin.site.register(ForumPost)
admin.site.register(ForumReply)
admin.site.register(ForumUpvote)
