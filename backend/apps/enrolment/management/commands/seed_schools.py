"""Seed sample schools and their school_admin logins.

``School.admin_user`` is a required OneToOneField, so every school needs an
administrator account. Those accounts double as the logins for the Next.js
dashboard in web/.

The seed password is read from the environment; nothing is hardcoded:

    SEED_SCHOOL_ADMIN_PASSWORD=... python manage.py seed_schools

If the variable is unset a strong random password is generated and printed once.
"""
import os
import secrets

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User, School

SCHOOLS = [
    dict(name='Government Bilingual High School Yaoundé', city='Yaoundé', region='Centre',
         subsystem='bilingual', school_type='public', admin_email='admin.gbhsyde@brailliants.test'),
    dict(name='Lycée Général Leclerc', city='Yaoundé', region='Centre',
         subsystem='francophone', school_type='public', admin_email='admin.leclerc@brailliants.test'),
    dict(name='Sacred Heart College Mankon', city='Bamenda', region='North-West',
         subsystem='anglophone', school_type='confessional', admin_email='admin.shcmankon@brailliants.test'),
    dict(name='Collège de la Retraite', city='Douala', region='Littoral',
         subsystem='francophone', school_type='private', admin_email='admin.retraite@brailliants.test'),
    dict(name='GBHS Molyko Buea', city='Buea', region='South-West',
         subsystem='anglophone', school_type='public', admin_email='admin.molyko@brailliants.test'),
]


class Command(BaseCommand):
    help = 'Seeds sample schools and their school_admin accounts.'

    @transaction.atomic
    def handle(self, *args, **options):
        password = os.environ.get('SEED_SCHOOL_ADMIN_PASSWORD')
        generated = False
        if not password:
            password = secrets.token_urlsafe(12)
            generated = True

        for spec in SCHOOLS:
            spec = dict(spec)
            admin_email = spec.pop('admin_email')
            first_name = spec['name'].split()[0][:100]

            admin = User.objects.filter(email=admin_email).first()
            if admin is None:
                admin = User.objects.create_user(
                    email=admin_email,
                    password=password,
                    first_name=first_name,
                    last_name='Admin',
                    role='school_admin',
                    is_verified=True,   # login rejects unverified accounts
                )
                self.stdout.write(f'  Created admin: {admin_email}')
            else:
                # Keep an existing seeded admin usable across re-runs.
                admin.role = 'school_admin'
                admin.is_verified = True
                admin.set_password(password)
                admin.save(update_fields=['role', 'is_verified', 'password'])
                self.stdout.write(f'  Admin exists (password reset): {admin_email}')

            school, created = School.objects.get_or_create(
                name=spec['name'],
                defaults={**spec, 'admin_user': admin, 'contact_email': admin_email},
            )
            if not created:
                for field, value in spec.items():
                    setattr(school, field, value)
                school.admin_user = admin
                school.save()
            self.stdout.write(f"{'Created' if created else 'Updated'}: {school.name}")

        self.stdout.write(self.style.SUCCESS(f'\n{len(SCHOOLS)} schools seeded.'))
        if generated:
            self.stdout.write(self.style.WARNING(
                f'Generated school-admin password (shown once): {password}\n'
                'Set SEED_SCHOOL_ADMIN_PASSWORD to choose your own.'
            ))
        else:
            self.stdout.write('School-admin password taken from SEED_SCHOOL_ADMIN_PASSWORD.')
