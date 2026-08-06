from django.urls import path

from . import views

# Mounted at /api/payments/ by config/urls.py.
urlpatterns = [
    path('initiate/',     views.InitiatePaymentView.as_view(),     name='payment-initiate'),
    path('status/',       views.PaymentStatusView.as_view(),       name='payment-status'),
    path('subscription/', views.CurrentSubscriptionView.as_view(), name='current-subscription'),
    path('webhook/',      views.CamPayWebhookView.as_view(),       name='campay-webhook'),
]
