import uuid
from django.db import models
from django.utils.text import slugify
from apps.accounts.models import User, School


def build_specialty_code(exam_levels, abbreviation) -> str:
    """Natural key for a specialty: first exam it belongs to + its abbreviation.

    e.g. (['HND'], 'MEC') -> 'hnd-mec'. Unique across the catalogue because an
    abbreviation is never reused within one exam.
    """
    first = (list(exam_levels or ['x']) or ['x'])[0]
    return slugify(f'{first}-{abbreviation}'.replace('_', '-'))

# Keep in sync with User.EXAM_CHOICES in apps/accounts/models.py.
EXAM_CHOICES = [
    # Anglophone — general secondary
    ('GCE_OL', 'GCE O/L'), ('GCE_AL', 'GCE A/L'),
    # Anglophone — technical & vocational secondary
    ('GCE_TVE_OL', 'GCE TVE Intermediate Level'),
    ('GCE_TVE_AL', 'GCE TVE Advanced Level'),
    # Anglophone — higher
    ('HND', 'HND'),
    # Francophone — general secondary
    ('CEP', 'CEP'), ('BEPC', 'BEPC'),
    ('PROBATOIRE', 'Probatoire Général'),
    ('BAC_GEN', 'Baccalauréat Général'),
    # Francophone — technical & tertiary secondary
    ('CAP', 'CAP'),
    ('PROBATOIRE_TECH', 'Probatoire Technique / STT'),
    ('BAC_TECH', 'Baccalauréat Technique & BT'),
    # Francophone — higher
    ('BTS', 'BTS'),
    # National competitive entrance exams (concours)
    ('CONCOURS_ENSP', 'Concours ENSP / Polytechnique'),
    ('CONCOURS_FMSB', 'Concours FMSB / CUSS'),
    ('CONCOURS_ENS', 'Concours ENS'),
    ('CONCOURS_ENAM', 'Concours ENAM'),
    ('CONCOURS_SANTE', 'Concours Santé Publique'),
    # Legacy codes — superseded by BAC_GEN + série specialties, kept so existing
    # user profiles and uploaded content referencing them stay valid.
    ('BAC_A', 'BAC A (legacy)'), ('BAC_C', 'BAC C (legacy)'),
    ('BAC_D', 'BAC D (legacy)'), ('BAC_E', 'BAC E (legacy)'),
]
LANG_CHOICES = [('en', 'English'), ('fr', 'French')]
SUBSYSTEM_CHOICES = [
    ('anglophone', 'Anglophone'),
    ('francophone', 'Francophone'),
    # National concours are sat by students from both subsystems.
    ('bilingual', 'Bilingual / both subsystems'),
]


class Specialty(models.Model):
    """A study track a student can belong to, e.g. Science (SCI) or Génie Logiciel (GL).

    ``exam_levels`` lists the exam codes the specialty appears under, so one row
    can serve several exams. A ``is_general`` specialty is a cross-cutting subject
    (General Mathematics, French) that belongs to many tracks at once.
    """
    id   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Stable natural key, e.g. 'hnd-swe'. The name alone cannot identify a row:
    # the real catalogue has "Mechanical Engineering (ME)" at GCE TVE and
    # "Mechanical Engineering (MEC)" at HND — same name, different qualification.
    code = models.SlugField(max_length=80, unique=True)

    name         = models.CharField(max_length=160)
    abbreviation = models.CharField(max_length=20)
    subsystem    = models.CharField(max_length=20, choices=SUBSYSTEM_CHOICES)
    exam_levels  = models.JSONField(default=list)
    # Grouping inside one exam, e.g. HND's 'Health & Biomedical Sciences'.
    category     = models.CharField(max_length=80, blank=True)
    is_general   = models.BooleanField(default=False)
    order        = models.IntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'specialties'
        ordering = ['order', 'name']
        verbose_name_plural = 'Specialties'

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = build_specialty_code(self.exam_levels, self.abbreviation)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} ({self.abbreviation})'


class Question(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title        = models.CharField(max_length=300)
    exam_type    = models.CharField(max_length=20, choices=EXAM_CHOICES)
    subject      = models.CharField(max_length=100)
    specialty    = models.CharField(max_length=100, blank=True)
    year         = models.SmallIntegerField()
    FORMAT = [('pdf', 'PDF'), ('json', 'JSON'), ('both', 'Both')]
    format       = models.CharField(max_length=10, choices=FORMAT)
    pdf_url      = models.TextField(null=True, blank=True)
    json_data    = models.JSONField(null=True, blank=True)
    file_size_kb = models.IntegerField(null=True, blank=True)
    language     = models.CharField(max_length=5, choices=LANG_CHOICES, default='en')
    # Tracks this paper belongs to. A paper can serve several specialties.
    specialties  = models.ManyToManyField(Specialty, blank=True, related_name='questions')
    # True for cross-cutting papers (General Mathematics, English, Philosophie):
    # they show under every specialty of the same exam, without being tagged
    # against each one by hand.
    is_general   = models.BooleanField(default=False)
    school       = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='questions')
    is_public    = models.BooleanField(default=True)
    uploaded_by  = models.ForeignKey(User, on_delete=models.PROTECT, related_name='uploaded_questions')
    download_count = models.IntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'questions'
        indexes = [
            models.Index(fields=['exam_type', 'subject', 'year']),
            models.Index(fields=['school', 'is_public']),
        ]


class Note(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title        = models.CharField(max_length=300)
    exam_type    = models.CharField(max_length=20, choices=EXAM_CHOICES)
    subject      = models.CharField(max_length=100)
    specialty    = models.CharField(max_length=100, blank=True)
    language     = models.CharField(max_length=5, choices=LANG_CHOICES, default='en')
    pdf_url      = models.TextField()
    file_size_kb = models.IntegerField(null=True, blank=True)
    specialties  = models.ManyToManyField(Specialty, blank=True, related_name='notes')
    is_general   = models.BooleanField(default=False)
    school       = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='notes')
    is_public    = models.BooleanField(default=True)
    uploaded_by  = models.ForeignKey(User, on_delete=models.PROTECT, related_name='uploaded_notes')
    download_count = models.IntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notes'


class Bookmark(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    CONTENT_TYPE = [('question', 'Question'), ('note', 'Note')]
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE)
    question     = models.ForeignKey(Question, on_delete=models.CASCADE, null=True, blank=True)
    note         = models.ForeignKey(Note, on_delete=models.CASCADE, null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookmarks'


class DownloadLog(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name='download_logs')
    question      = models.ForeignKey(Question, on_delete=models.CASCADE, null=True, blank=True)
    note          = models.ForeignKey(Note, on_delete=models.CASCADE, null=True, blank=True)
    downloaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'download_logs'
