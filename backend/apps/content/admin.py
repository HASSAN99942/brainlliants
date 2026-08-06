from django.contrib import admin

from .models import Specialty, Question, Note, Bookmark, DownloadLog


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ('name', 'abbreviation', 'subsystem', 'category', 'exam_levels', 'is_general', 'order')
    list_filter = ('subsystem', 'category', 'is_general')
    search_fields = ('name', 'abbreviation', 'code')
    ordering = ('subsystem', 'order', 'name')
    readonly_fields = ('created_at',)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['title', 'exam_type', 'subject', 'year', 'format', 'language',
                    'is_general', 'is_public', 'download_count']
    list_filter = ['exam_type', 'subject', 'language', 'is_general', 'is_public', 'format']
    search_fields = ['title', 'subject']
    readonly_fields = ['download_count', 'created_at']
    filter_horizontal = ['specialties']
    fieldsets = (
        ('Paper information', {'fields': ('title', 'exam_type', 'subject', 'specialty', 'year', 'language')}),
        ('Specialties', {
            'fields': ('specialties', 'is_general'),
            'description': (
                'Tick <b>is general</b> for a cross-cutting paper (General Mathematics, '
                'English, Philosophie): it shows under every specialty of its exam and '
                'needs no individual tags. Otherwise pick the specialties it belongs to.'
            ),
        }),
        ('Content', {'fields': ('format', 'pdf_url', 'json_data', 'file_size_kb')}),
        ('Visibility', {'fields': ('is_public', 'school', 'uploaded_by')}),
        ('Stats', {'fields': ('download_count', 'created_at')}),
    )


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'exam_type', 'subject', 'language', 'is_general', 'is_public', 'download_count']
    list_filter = ['exam_type', 'subject', 'language', 'is_general', 'is_public']
    search_fields = ['title', 'subject']
    readonly_fields = ['download_count', 'created_at']
    filter_horizontal = ['specialties']


admin.site.register(Bookmark)
admin.site.register(DownloadLog)
