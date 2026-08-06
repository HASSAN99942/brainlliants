from django.contrib import admin
from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'status', 'payment_method', 'amount_xaf', 'end_date', 'created_at')
    list_filter = ('status', 'plan', 'payment_method')
    search_fields = ('user__email', 'campay_reference')
    readonly_fields = ('created_at',)
