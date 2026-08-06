"""Create or repair the super admin from environment variables.

Runs on every deploy (see the Render build command), so it must be idempotent:
it never creates a duplicate and never resets an existing password.

Why not `createsuperuser`? It cannot set this project's own `role` and
`is_verified` fields, and it needs a TTY — which the Render free tier has no
shell for.

    DJANGO_SUPERUSER_EMAIL=you@example.com \
    DJANGO_SUPERUSER_PASSWORD=... \
    python manage.py create_admin
"""
import os

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand
from django.core.validators import validate_email

User = get_user_model()

MIN_PASSWORD_LENGTH = 8


class Command(BaseCommand):
    help = 'Creates or updates the super admin from environment variables. Idempotent.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset-password', action='store_true',
            help='Also reset an existing admin\'s password to DJANGO_SUPERUSER_PASSWORD.',
        )

    def handle(self, *args, **options):
        email = (os.environ.get('DJANGO_SUPERUSER_EMAIL') or '').strip()
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD') or ''
        first = os.environ.get('DJANGO_SUPERUSER_FIRST_NAME', 'Super').strip() or 'Super'
        last = os.environ.get('DJANGO_SUPERUSER_LAST_NAME', 'Admin').strip() or 'Admin'

        if not email or not password:
            # A missing config must not fail the deploy — the rest of the build
            # is still valid, so warn and move on.
            self.stdout.write(self.style.WARNING(
                'DJANGO_SUPERUSER_EMAIL / DJANGO_SUPERUSER_PASSWORD not set — '
                'skipping admin creation.'
            ))
            return

        try:
            validate_email(email)
        except ValidationError:
            self.stderr.write(self.style.ERROR(
                f'DJANGO_SUPERUSER_EMAIL is not a valid email address: {email!r}'
            ))
            return

        if len(password) < MIN_PASSWORD_LENGTH:
            self.stderr.write(self.style.ERROR(
                f'DJANGO_SUPERUSER_PASSWORD is too short '
                f'(minimum {MIN_PASSWORD_LENGTH} characters).'
            ))
            return

        user = User.objects.filter(email__iexact=email).first()
        if user:
            self.repair(user, email, options['reset_password'])
            return

        # create_superuser comes from CustomUserManager and already sets
        # is_staff / is_superuser / is_verified / role='super_admin'. The
        # explicit save below keeps this correct even if that changes.
        user = User.objects.create_superuser(
            email=email, password=password, first_name=first, last_name=last,
        )
        user.role = 'super_admin'
        user.is_verified = True
        user.save(update_fields=['role', 'is_verified'])
        self.stdout.write(self.style.SUCCESS(f'Super admin created: {email}'))

    def repair(self, user, email, reset_password):
        """Give an existing account the right powers without touching its password."""
        changed = []
        for field, value in (
            ('is_superuser', True),
            ('is_staff', True),
            ('is_active', True),
            ('is_verified', True),
            ('role', 'super_admin'),
        ):
            if getattr(user, field) != value:
                setattr(user, field, value)
                changed.append(field)

        if reset_password:
            user.set_password(os.environ.get('DJANGO_SUPERUSER_PASSWORD'))
            changed.append('password')

        if changed:
            user.save(update_fields=changed)
            self.stdout.write(self.style.SUCCESS(
                f'Admin {email} updated: {", ".join(changed)}'
            ))
        else:
            self.stdout.write(f'Admin {email} already correct — nothing to do.')
