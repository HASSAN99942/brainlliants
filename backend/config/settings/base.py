import os
from pathlib import Path
from datetime import timedelta

from django.core.exceptions import ImproperlyConfigured  # noqa: F401  (used by production.py)
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

DJANGO_APPS = [
    # daphne must precede staticfiles so Channels' ASGI runserver replaces the
    # default WSGI one (needed for WebSocket support in development).
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.facebook',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'drf_spectacular',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.enrolment',
    'apps.content',
    'apps.ai_learning',
    'apps.forum',
    'apps.community',
    'apps.planner',
    'apps.payments',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # Serves collected static files in production; Render does not serve them
    # for you and Django only does so with DEBUG=True. Must sit directly after
    # SecurityMiddleware.
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = 'accounts.User'
SITE_ID = 1

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'brailliants'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Managed hosts (Render, Heroku, Railway…) hand out one connection string
# instead of the discrete DB_* parts above. When present it wins.
DATABASE_URL = (os.environ.get('DATABASE_URL') or '').strip()
if DATABASE_URL:
    import dj_database_url
    DATABASES['default'] = dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600,
        # Render's managed Postgres requires TLS.
        ssl_require=os.environ.get('DB_SSL_REQUIRE', 'True') == 'True',
    )
elif os.environ.get('RENDER_EXTERNAL_HOSTNAME'):
    # On Render the only way to reach the managed Postgres is DATABASE_URL.
    # Failing here with a clear message beats a psycopg2 "connection refused"
    # traceback aimed at localhost. The render.yaml Blueprint wires this up
    # automatically; a manually created service needs it added by hand.
    raise ImproperlyConfigured(
        'DATABASE_URL is not set. Create a Postgres instance on Render and set '
        'this service\'s DATABASE_URL to its "Internal Database URL" (or redeploy '
        'via the render.yaml Blueprint, which fills it in automatically).'
    )

# Redis backs both the WebSocket channel layer and Celery. Managed Redis is
# given as a single URL (often rediss:// with credentials), which the old
# host+port pair could not express.
REDIS_URL = os.environ.get('REDIS_URL')
if REDIS_URL:
    CHANNEL_LAYER_HOSTS = [REDIS_URL]
else:
    CHANNEL_LAYER_HOSTS = [(os.environ.get('REDIS_HOST', '127.0.0.1'),
                            int(os.environ.get('REDIS_PORT', 6379)))]

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': CHANNEL_LAYER_HOSTS},
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    # Rotation is OFF: the mobile client stores the original refresh token and
    # never swaps in the rotated one (mobile-rn/src/core/network/apiClient.ts
    # keeps `currentRefresh`), so with rotation+blacklisting the SECOND refresh
    # would fail against the now-blacklisted token and force a re-login.
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# dj-rest-auth issues SimpleJWT tokens (no DRF authtoken table).
# TOKEN_MODEL=None is required, otherwise dj-rest-auth demands
# rest_framework.authtoken in INSTALLED_APPS.
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'brailliants-access',
    'JWT_AUTH_REFRESH_COOKIE': 'brailliants-refresh',
    'JWT_AUTH_HTTPONLY': True,
    'SESSION_LOGIN': False,
    'TOKEN_MODEL': None,
}

# allauth 0.63: authenticate by email only (User has no username field).
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = 'optional'

CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ORIGINS',
    'http://localhost:3000,http://localhost:8080'
).split(',')
CORS_ALLOW_CREDENTIALS = True

_CELERY_DEFAULT = REDIS_URL or 'redis://127.0.0.1:6379/0'
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER', _CELERY_DEFAULT)
CELERY_RESULT_BACKEND = os.environ.get('CELERY_BACKEND', _CELERY_DEFAULT)

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Douala'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {
        # Compresses and fingerprints collected static files.
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

DEFAULT_FROM_EMAIL = 'noreply@brailliants.cm'

# External services — read from .env
GEMINI_API_KEY   = os.environ.get('GEMINI_API_KEY', '')
CAMPAY_USERNAME  = os.environ.get('CAMPAY_USERNAME', '')
CAMPAY_PASSWORD  = os.environ.get('CAMPAY_PASSWORD', '')
CAMPAY_BASE_URL  = os.environ.get('CAMPAY_BASE_URL', 'https://demo.campay.net/api/')
FCM_SERVER_KEY   = os.environ.get('FCM_SERVER_KEY', '')

# Feature flags — must stay in sync with mobile-rn/src/core/config/features.ts.
# While PAYMENTS_ENABLED is false there is no way for a user to upgrade, so the
# freemium caps are lifted (everyone is treated as unlimited) instead of walling
# users in. The paywall and the limits switch back on together.
PAYMENTS_ENABLED = os.environ.get('PAYMENTS_ENABLED', 'false').lower() == 'true'

SPECTACULAR_SETTINGS = {
    'TITLE': 'Brailliants API',
    'DESCRIPTION': 'AI-powered bilingual educational platform for Cameroonian students',
    'VERSION': '1.0.0',
}
