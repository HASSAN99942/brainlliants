import requests
from django.conf import settings


def send_push(tokens, title, body, data=None):
    """Send an FCM push to a list of device tokens (legacy HTTP API)."""
    if not settings.FCM_SERVER_KEY or not tokens:
        return
    headers = {
        'Authorization': f'key={settings.FCM_SERVER_KEY}',
        'Content-Type': 'application/json',
    }
    for token in tokens:
        payload = {
            'to': token,
            'notification': {'title': title, 'body': body},
            'data': data or {},
        }
        try:
            requests.post('https://fcm.googleapis.com/fcm/send', json=payload, headers=headers, timeout=5)
        except Exception:
            pass
