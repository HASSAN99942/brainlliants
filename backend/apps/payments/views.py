import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Subscription
from .serializers import InitiatePaymentSerializer, SubscriptionSerializer
from .services import campay_service, subscription_service
from .services.campay_service import CamPayError, PRO_PRICE_XAF

logger = logging.getLogger(__name__)


class InitiatePaymentView(APIView):
    """POST /api/payments/initiate/  {phone_number, payment_method}"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data['phone_number']
        method = serializer.validated_data['payment_method']

        subscription_service.sync_expiry(request.user)
        if request.user.is_pro:
            return Response(
                {'error': 'You already have an active Pro subscription.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = campay_service.request_collection(
                phone=phone,
                amount=PRO_PRICE_XAF,
                description='Brailliants Pro — 1 month',
            )
        except CamPayError as exc:
            logger.error('Payment initiation failed for %s: %s', request.user.email, exc)
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        subscription = Subscription.objects.create(
            user=request.user,
            plan='pro',
            payment_method=method,
            amount_xaf=PRO_PRICE_XAF,
            campay_reference=result['reference'],
            status=result['status'],
        )
        if subscription.status == 'active':
            subscription_service.activate(subscription)

        return Response({
            'subscription_id': str(subscription.id),
            'campay_reference': subscription.campay_reference,
            'status': subscription.status,
            'amount_xaf': PRO_PRICE_XAF,
            'simulated': result['simulated'],
        }, status=status.HTTP_201_CREATED)


class PaymentStatusView(APIView):
    """GET /api/payments/status/?subscription_id=<uuid>"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subscription_id = request.query_params.get('subscription_id')
        if not subscription_id:
            return Response({'error': 'subscription_id is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            subscription = Subscription.objects.get(id=subscription_id, user=request.user)
        except (Subscription.DoesNotExist, DjangoValidationError, ValueError, TypeError):
            # A malformed UUID raises ValidationError from the field, not DoesNotExist.
            return Response({'error': 'Subscription not found.'},
                            status=status.HTTP_404_NOT_FOUND)

        # Settled already — no need to bother the gateway again.
        if subscription.status in ('active', 'failed', 'expired'):
            return Response(self._payload(request.user, subscription))

        try:
            new_status = campay_service.check_status(
                subscription.campay_reference, requested_at=subscription.created_at,
            )
        except CamPayError as exc:
            # Keep the client polling rather than failing a payment that may
            # still succeed.
            logger.warning('Status check failed for %s: %s', subscription.id, exc)
            return Response(self._payload(request.user, subscription))

        if new_status == 'active':
            subscription_service.activate(subscription)
        elif new_status == 'failed':
            subscription_service.fail(subscription)

        subscription.refresh_from_db()
        return Response(self._payload(request.user, subscription))

    @staticmethod
    def _payload(user, subscription):
        user.refresh_from_db(fields=['is_pro', 'pro_expiry'])
        return {
            'status': subscription.status,
            'plan': 'pro' if user.is_pro else 'free',
            'is_pro': user.is_pro,
            'pro_expiry': user.pro_expiry,
            'subscription': SubscriptionSerializer(subscription).data,
        }


class CurrentSubscriptionView(APIView):
    """GET /api/payments/subscription/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subscription = subscription_service.current_subscription(request.user)
        return Response({
            'plan': 'pro' if request.user.is_pro else 'free',
            'is_pro': request.user.is_pro,
            'pro_expiry': request.user.pro_expiry,
            'price_xaf': PRO_PRICE_XAF,
            'subscription': SubscriptionSerializer(subscription).data if subscription else None,
        })


class CamPayWebhookView(APIView):
    """POST /api/payments/webhook/ — CamPay calls this when a collection settles.

    Unauthenticated by design (CamPay is the caller); the reference is the
    shared secret, and an unknown one is ignored.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        reference = request.data.get('reference') or request.data.get('external_reference')
        campay_status = request.data.get('status')
        if not reference:
            return Response({'error': 'reference is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        subscription = Subscription.objects.filter(campay_reference=reference).first()
        if subscription is None:
            logger.warning('Webhook for unknown reference %s', reference)
            return Response({'detail': 'ignored'}, status=status.HTTP_200_OK)

        mapped = campay_service.map_status(campay_status)
        if mapped == 'active' and subscription.status != 'active':
            subscription_service.activate(subscription)
        elif mapped == 'failed' and subscription.status == 'pending':
            subscription_service.fail(subscription)

        return Response({'detail': 'ok'}, status=status.HTTP_200_OK)
