"""CamPay client — MTN Mobile Money and Orange Money collections.

Credentials come from the environment (CAMPAY_USERNAME / CAMPAY_PASSWORD /
CAMPAY_BASE_URL); nothing is hardcoded.

When credentials are absent the client runs in **simulation mode** so the
checkout flow is demonstrable without a CamPay account: a collection is accepted
immediately and settles to SUCCESSFUL after SIMULATED_DELAY_SECONDS. Simulation
never runs unless the credentials are genuinely missing, so configuring them is
all it takes to hit the real sandbox.
"""
import logging
import time
import uuid

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

PRO_PRICE_XAF = 1000
PRO_DURATION_DAYS = 30

# How long a simulated collection stays PENDING, so the client's polling UI is
# exercised exactly as it would be against the real gateway.
SIMULATED_DELAY_SECONDS = 6

REQUEST_TIMEOUT = 20

# CamPay statuses -> our Subscription.status
_STATUS_MAP = {
    'SUCCESSFUL': 'active',
    'FAILED': 'failed',
    'CANCELLED': 'failed',
    'EXPIRED': 'failed',
    'PENDING': 'pending',
}


class CamPayError(Exception):
    """Raised when CamPay cannot be reached or rejects a request."""


def is_simulated() -> bool:
    return not (settings.CAMPAY_USERNAME and settings.CAMPAY_PASSWORD)


def _base_url() -> str:
    return settings.CAMPAY_BASE_URL.rstrip('/') + '/'


def map_status(campay_status: str) -> str:
    return _STATUS_MAP.get((campay_status or '').upper(), 'pending')


def normalise_phone(phone: str) -> str:
    """CamPay wants 237XXXXXXXXX. Accept +237..., 6XXXXXXXX and spaced input."""
    digits = ''.join(ch for ch in (phone or '') if ch.isdigit())
    if len(digits) == 9 and digits.startswith('6'):
        digits = '237' + digits
    return digits


def is_valid_phone(phone: str) -> bool:
    digits = normalise_phone(phone)
    return len(digits) == 12 and digits.startswith('237') and digits[3] == '6'


def get_token() -> str:
    """Fetch a CamPay access token."""
    try:
        response = requests.post(
            f'{_base_url()}token/',
            json={
                'username': settings.CAMPAY_USERNAME,
                'password': settings.CAMPAY_PASSWORD,
            },
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise CamPayError(f'Could not reach CamPay: {exc}') from exc

    if response.status_code != 200:
        raise CamPayError(f'CamPay rejected the credentials ({response.status_code}).')
    token = response.json().get('token')
    if not token:
        raise CamPayError('CamPay returned no token.')
    return token


def request_collection(phone: str, amount: int, description: str) -> dict:
    """Ask the payer to confirm a collection on their handset.

    Returns ``{'reference': str, 'status': <our status>, 'simulated': bool}``.
    """
    msisdn = normalise_phone(phone)

    if is_simulated():
        reference = f'SIM-{uuid.uuid4()}'
        logger.warning(
            'CamPay credentials are not configured — simulating collection %s '
            'for %s XAF from %s. Set CAMPAY_USERNAME/CAMPAY_PASSWORD to use the '
            'real sandbox.', reference, amount, msisdn,
        )
        return {'reference': reference, 'status': 'pending', 'simulated': True}

    token = get_token()
    try:
        response = requests.post(
            f'{_base_url()}collect/',
            headers={'Authorization': f'Token {token}'},
            json={
                'amount': str(amount),
                'from': msisdn,
                'description': description,
                'currency': 'XAF',
            },
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise CamPayError(f'Could not reach CamPay: {exc}') from exc

    if response.status_code not in (200, 201):
        logger.error('CamPay collect failed: %s %s', response.status_code, response.text[:400])
        raise CamPayError('CamPay could not start the payment.')

    payload = response.json()
    reference = payload.get('reference')
    if not reference:
        raise CamPayError('CamPay returned no reference.')

    logger.info('CamPay collection %s requested for %s XAF from %s', reference, amount, msisdn)
    return {
        'reference': reference,
        'status': map_status(payload.get('status', 'PENDING')),
        'simulated': False,
    }


def check_status(reference: str, requested_at=None) -> str:
    """Poll a collection. Returns one of pending / active / failed."""
    if reference and reference.startswith('SIM-'):
        if requested_at is None:
            return 'active'
        elapsed = time.time() - requested_at.timestamp()
        return 'active' if elapsed >= SIMULATED_DELAY_SECONDS else 'pending'

    token = get_token()
    try:
        response = requests.get(
            f'{_base_url()}transaction/{reference}/',
            headers={'Authorization': f'Token {token}'},
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise CamPayError(f'Could not reach CamPay: {exc}') from exc

    if response.status_code != 200:
        logger.error('CamPay status failed: %s %s', response.status_code, response.text[:400])
        raise CamPayError('CamPay could not report the payment status.')

    return map_status(response.json().get('status', 'PENDING'))
