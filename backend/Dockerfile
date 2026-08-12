FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production

WORKDIR /app

# System deps for psycopg2 / pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

# Daphne (not gunicorn) serves the ASGI application, which is what powers the
# community WebSocket chat. Migrations and the idempotent super-admin bootstrap
# run on every start so a fresh database works with zero manual steps.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py create_admin && daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application"]
