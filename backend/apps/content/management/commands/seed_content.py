from django.core.management.base import BaseCommand
from apps.accounts.models import User
from apps.content.models import Question, Note, Specialty


PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

SAMPLE_JSON = {
    "questions": [
        {
            "question": "Solve: x² − 5x + 6 = 0",
            "options": ["x = 1, 6", "x = 2, 3", "x = −2, −3", "x = 5, 6"],
            "correct_option": 1,
            "explanation": "Factorise: (x − 2)(x − 3) = 0, so x = 2 or x = 3."
        },
        {
            "question": "What is the discriminant of ax² + bx + c = 0?",
            "options": ["b² − 4ac", "b² + 4ac", "4ac − b²", "2a/b"],
            "correct_option": 0,
            "explanation": "Δ = b² − 4ac determines the nature of the roots."
        },
        {
            "question": "If Δ < 0, the roots are:",
            "options": ["Real and equal", "Real and distinct", "Complex", "Zero"],
            "correct_option": 2,
            "explanation": "A negative discriminant gives complex conjugate roots."
        }
    ]
}


class Command(BaseCommand):
    help = 'Seeds sample questions and notes for development'

    def handle(self, *args, **options):
        admin = User.objects.filter(role='super_admin').first() or User.objects.filter(is_superuser=True).first()
        if not admin:
            self.stdout.write(self.style.ERROR('Create a superuser first.'))
            return

        # `tags` holds Specialty.code values (see seed_specialties.py). A paper
        # with is_general=True needs no tags: it shows under every specialty of
        # its exam.
        samples_q = [
            dict(title='GCE A/L Physics — Paper 2', exam_type='GCE_AL', subject='Physics',
                 specialty='Science', year=2023, format='pdf', language='en',
                 pdf_url=PDF, file_size_kb=2458,
                 tags=['gce-ol-sci']),
            # General paper: appears for Arts students as well as Science.
            dict(title='GCE A/L Mathematics — Pure Maths', exam_type='GCE_AL', subject='Maths',
                 specialty='Science', year=2023, format='json', language='en',
                 json_data=SAMPLE_JSON, file_size_kb=1126,
                 is_general=True),
            # Tagged against two séries at once.
            dict(title='BAC Général Mathématiques — Session 2022', exam_type='BAC_GEN', subject='Maths',
                 specialty='Série D', year=2022, format='pdf', language='fr',
                 pdf_url=PDF, file_size_kb=3072,
                 tags=['probatoire-c', 'probatoire-d']),
            dict(title='BEPC Sciences — Épreuve complète', exam_type='BEPC', subject='Sciences',
                 year=2024, format='pdf', language='fr', pdf_url=PDF, file_size_kb=1843,
                 tags=['bepc-gen']),
            dict(title='HND Software Engineering — Programming Paper', exam_type='HND',
                 subject='Programming', specialty='Software Engineering', year=2024,
                 format='pdf', language='en', pdf_url=PDF, file_size_kb=2210,
                 tags=['hnd-swe']),
        ]
        for data in samples_q:
            self.upsert(Question, data, admin)

        samples_n = [
            dict(title='Photosynthesis — Complete Revision Notes', exam_type='GCE_AL', subject='Biology',
                 specialty='Science', language='en', pdf_url=PDF, file_size_kb=980,
                 tags=['gce-ol-sci']),
            dict(title='Les Fonctions — Fiche de révision', exam_type='BAC_GEN', subject='Maths',
                 language='fr', pdf_url=PDF, file_size_kb=764,
                 is_general=True),
        ]
        for data in samples_n:
            self.upsert(Note, data, admin)

        self.stdout.write(self.style.SUCCESS('Seed complete.'))

    def upsert(self, model, data, admin):
        """Create or refresh one paper and re-apply its specialty tags."""
        data = dict(data)
        tags = data.pop('tags', [])
        obj, created = model.objects.update_or_create(
            title=data['title'], defaults={**data, 'uploaded_by': admin},
        )

        specialties = list(Specialty.objects.filter(code__in=tags))
        missing = set(tags) - {s.code for s in specialties}
        obj.specialties.set(specialties)

        label = 'general' if data.get('is_general') else (
            ', '.join(s.abbreviation for s in specialties) or 'untagged'
        )
        self.stdout.write(f"{'Created' if created else 'Updated'}: {obj.title}  [{label}]")
        if missing:
            self.stdout.write(self.style.WARNING(
                f'  unknown specialty code(s): {sorted(missing)} — run seed_specialties first'
            ))
