from rest_framework import serializers

from .models import Subscription
from .services.campay_service import is_valid_phone, normalise_phone


class InitiatePaymentSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    payment_method = serializers.ChoiceField(choices=[m[0] for m in Subscription.METHOD])

    def validate_phone_number(self, value):
        if not is_valid_phone(value):
            raise serializers.ValidationError(
                'Enter a Cameroon mobile money number, e.g. 237670000000.'
            )
        return normalise_phone(value)


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'payment_method', 'amount_xaf', 'status',
            'start_date', 'end_date', 'created_at',
        ]
