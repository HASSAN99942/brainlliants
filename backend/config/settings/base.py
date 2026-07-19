import os
from pathlib import Path
from datetime import timedelta
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

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(os.environ.get('REDIS_HOST', '127.0.0.1'), 6379)],
        },
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
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
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

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER', 'redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_BACKEND', 'redis://127.0.0.1:6379/0')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Douala'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_FROM_EMAIL = 'noreply@brailliants.cm'

# External services — read from .env
GEMINI_API_KEY   = os.environ.get('GEMINI_API_KEY', '')
CAMPAY_USERNAME  = os.environ.get('CAMPAY_USERNAME', '')
CAMPAY_PASSWORD  = os.environ.get('CAMPAY_PASSWORD', '')
CAMPAY_BASE_URL  = os.environ.get('CAMPAY_BASE_URL', 'https://demo.campay.net/api/')
FCM_SERVER_KEY   = os.environ.get('FCM_SERVER_KEY', '')

SPECTACULAR_SETTINGS = {
    'TITLE': 'Brailliants API',
    'DESCRIPTION': 'AI-powered bilingual educational platform for Cameroonian students',
    'VERSION': '1.0.0',
}
