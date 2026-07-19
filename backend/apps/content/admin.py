from django.contrib import admin
from .models import Question, Note, Bookmark, DownloadLog


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['title', 'exam_type', 'subject', 'year', 'format', 'language', 'is_public', 'download_count']
    list_filter = ['exam_type', 'subject', 'language', 'is_public', 'format']
    search_fields = ['title', 'subject']
    readonly_fields = ['download_count', 'created_at']
    fieldsets = (
        ('Paper information', {'fields': ('title', 'exam_type', 'subject', 'specialty', 'year', 'language')}),
        ('Content', {'fields': ('format', 'pdf_url', 'json_data', 'file_size_kb')}),
        ('Visibility', {'fields': ('is_public', 'school', 'uploaded_by')}),
        ('Stats', {'fields': ('download_count', 'created_at')}),
    )


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'exam_type', 'subject', 'language', 'is_public', 'download_count']
    list_filter = ['exam_type', 'subject', 'language', 'is_public']
    search_fields = ['title', 'subject']
    readonly_fields = ['download_count', 'created_at']


admin.site.register(Bookmark)
admin.site.register(DownloadLog)
