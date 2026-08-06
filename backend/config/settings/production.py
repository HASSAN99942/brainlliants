from .base import *

DEBUG = False
CORS_ALLOW_ALL_ORIGINS = False

# --- Security -------------------------------------------------------------
# Render terminates TLS at its proxy, so Django only sees http:// unless it is
# told to trust the forwarded header. Without this, SECURE_SSL_REDIRECT would
# loop forever.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True'

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HSTS: start conservative. Raise to 31536000 (1 year) once you are confident
# the domain will stay on HTTPS — browsers honour it for the full duration.
SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', 3600))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# Django 4+ checks the Origin header on unsafe requests behind HTTPS; the admin
# login will 403 without the deployed host listed here.
CSRF_TRUSTED_ORIGINS = [
    f'https://{host.strip()}'
    for host in os.environ.get('ALLOWED_HOSTS', '').split(',')
    if host.strip() and host.strip() != '*'
]

# Refuse to boot on the development SECRET_KEY.
if SECRET_KEY == 'dev-secret-key-change-in-production':
    raise ImproperlyConfigured(
        'SECRET_KEY is still the development default. Set a fresh SECRET_KEY '
        'environment variable before deploying.'
    )

# --- File storage ---------------------------------------------------------
# S3 for uploads when configured; WhiteNoise keeps serving static either way.
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_BUCKET_NAME', '')
AWS_S3_REGION_NAME = os.environ.get('AWS_REGION', 'eu-west-1')

if AWS_STORAGE_BUCKET_NAME:
    STORAGES['default'] = {'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage'}
