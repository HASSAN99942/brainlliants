from .base import *

DEBUG = True
CORS_ALLOW_ALL_ORIGINS = True
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Dev only: allow any Host header so a physical device (Expo Go over LAN/hotspot)
# can reach the server via the PC's LAN IP, not just localhost.
ALLOWED_HOSTS = ['*']

# ---------------------------------------------------------------------------
# Local-dev database fallback.
#
# Production and base.py target PostgreSQL 15 (see CLAUDE.md). This machine has
# no PostgreSQL / Redis / Docker installed, so by default local development
# uses SQLite plus an in-memory channel layer, which lets the scaffold migrate
# and run immediately with zero external services.
#
# To use PostgreSQL locally instead (e.g. once docker-compose is up), set the
# environment variable USE_POSTGRES=True and the base.py Postgres config kicks
# back in unchanged.
# ---------------------------------------------------------------------------
if os.environ.get('USE_POSTGRES', 'False') != 'True':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        }
    }
