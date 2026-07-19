from django.core.management.base import BaseCommand
from apps.community.models import CommunityGroup


GROUPS = [
    dict(name='GCE A/L Sciences Hub', exam_type='GCE_AL', subject='Sciences', language='en', member_count=128),
    dict(name='BAC D Maths Warriors', exam_type='BAC_D', subject='Maths', language='fr', member_count=86),
    dict(name='BEPC Prep 2026', exam_type='BEPC', subject='General', language='fr', member_count=210),
    dict(name='HND Computer Science', exam_type='HND', subject='Computer Science', language='en', member_count=54),
    dict(name='GCE O/L General', exam_type='GCE_OL', subject='General', language='en', member_count=95),
    dict(name='BAC C Physique-Chimie', exam_type='BAC_C', subject='Physics', language='fr', member_count=72),
]


class Command(BaseCommand):
    help = 'Seeds community study groups'

    def handle(self, *args, **options):
        for g in GROUPS:
            obj, created = CommunityGroup.objects.get_or_create(name=g['name'], defaults=g)
            self.stdout.write(f"{'Created' if created else 'Exists'}: {obj.name}")
        self.stdout.write(self.style.SUCCESS('Community seed complete.'))
