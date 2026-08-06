"""Seeds the specialty catalogue.

Run: python manage.py seed_specialties
     python manage.py seed_specialties --prune   (also delete rows no longer listed)

HOW ROWS ARE KEYED
------------------
Each specialty gets a stable `code` derived from its first exam level plus its
abbreviation, e.g. ('HND', 'MEC') -> 'hnd-mec'. The name alone is not unique:
the catalogue really does contain "Mechanical Engineering (ME)" at GCE TVE and
"Mechanical Engineering (MEC)" at HND, and "Électrotechnique" as both F3
(Probatoire/Bac Technique) and ELT (BTS). Those are different qualifications and
stay separate rows.

WHEN IS A SPECIALTY SHARED ACROSS EXAMS?
----------------------------------------
One row lists several exam_levels only when the name AND abbreviation are
identical, i.e. it is genuinely the same track continuing:
  * Arts / Science            -> GCE_OL + GCE_AL
  * Electrical Power Systems  -> GCE_TVE_OL + GCE_TVE_AL
  * the séries (A1..A5, C, D, TI, AC) -> PROBATOIRE + BAC_GEN
  * Bilingue                  -> BEPC + PROBATOIRE + BAC_GEN
  * the STT/industrial tracks -> PROBATOIRE_TECH + BAC_TECH
Everything else is one row per exam.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.content.models import Specialty, build_specialty_code

# Education-stream groupings, used as section headers in the app's dropdown.
GEN_EN = 'General Education'
TVE_EN = 'Technical & Vocational'
GEN_FR = 'Enseignement Général'
TEC_FR = 'Enseignement Technique'

A = 'anglophone'
F = 'francophone'
B = 'bilingual'   # national concours — sat by students from both subsystems

# =============================================================================
# THE CATALOGUE
# =============================================================================
SPECIALTIES: list[dict] = [

    # ------------------------------------------------------------------ #
    # ANGLOPHONE — Secondary Education (MINESEC / GCE Board)
    # ------------------------------------------------------------------ #
    # GCE O/L and A/L share the same two general tracks.
    dict(name='Arts', abbreviation='ARTS', subsystem=A, category=GEN_EN,
         exam_levels=['GCE_OL', 'GCE_AL'], order=1),
    dict(name='Science', abbreviation='SCI', subsystem=A, category=GEN_EN,
         exam_levels=['GCE_OL', 'GCE_AL'], order=2),

    # GCE TVE Intermediate Level (O/L Technical)
    dict(name='Business Studies', abbreviation='BS', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_OL'], order=1),
    dict(name='Building Construction', abbreviation='BC', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_OL'], order=2),
    # Also offered at Advanced Level under the same name and abbreviation.
    dict(name='Electrical Power Systems', abbreviation='EPS', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_OL', 'GCE_TVE_AL'], order=3),
    dict(name='Mechanical Engineering', abbreviation='ME', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_OL'], order=4),
    dict(name='Home Economics', abbreviation='HE', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_OL'], order=5),
    dict(name='Clothing Industry', abbreviation='CI', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_OL'], order=6),
    dict(name='Automobile Mechanics', abbreviation='AM', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_OL'], order=7),

    # GCE TVE Advanced Level (A/L Technical)
    dict(name='Accounting', abbreviation='ACC', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_AL'], order=1),
    dict(name='Secretarial Administration & Communication', abbreviation='SAC', subsystem=A,
         category=TVE_EN, exam_levels=['GCE_TVE_AL'], order=2),
    dict(name='Marketing', abbreviation='MKT', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_AL'], order=3),
    dict(name='Taxation & Information Management Systems', abbreviation='TIMS', subsystem=A,
         category=TVE_EN, exam_levels=['GCE_TVE_AL'], order=4),
    dict(name='Civil Engineering - Building Construction', abbreviation='CE-BC', subsystem=A,
         category=TVE_EN, exam_levels=['GCE_TVE_AL'], order=5),
    dict(name='Civil Engineering - Architectural Draftsmanship', abbreviation='CE-AD', subsystem=A,
         category=TVE_EN, exam_levels=['GCE_TVE_AL'], order=6),
    dict(name='Civil Engineering - Public Works', abbreviation='CE-PW', subsystem=A,
         category=TVE_EN, exam_levels=['GCE_TVE_AL'], order=7),
    dict(name='Electronics', abbreviation='ELT', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_AL'], order=8),
    dict(name='Automobile Construction - Light Vehicle', abbreviation='AM-LV', subsystem=A,
         category=TVE_EN, exam_levels=['GCE_TVE_AL'], order=9),
    dict(name='Automobile Construction - Heavy Duty', abbreviation='AH-HD', subsystem=A,
         category=TVE_EN, exam_levels=['GCE_TVE_AL'], order=10),
    dict(name='Mechanical Manufacturing', abbreviation='MM', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_AL'], order=11),
    dict(name='Clothing Industry', abbreviation='CLIN', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_AL'], order=12),
    dict(name='Woodwork Technology', abbreviation='WWT', subsystem=A, category=TVE_EN,
         exam_levels=['GCE_TVE_AL'], order=13),

    # ------------------------------------------------------------------ #
    # ANGLOPHONE — Higher Education (MINESUP): HND
    # ------------------------------------------------------------------ #
    dict(name='Software Engineering', abbreviation='SWE', subsystem=A,
         category='Technology & Engineering', exam_levels=['HND'], order=1),
    dict(name='Computer Networking & Cyber Security', abbreviation='CNS', subsystem=A,
         category='Technology & Engineering', exam_levels=['HND'], order=2),
    dict(name='Information Systems Management', abbreviation='ISM', subsystem=A,
         category='Technology & Engineering', exam_levels=['HND'], order=3),
    dict(name='Electrical & Electronics Engineering', abbreviation='EEE', subsystem=A,
         category='Technology & Engineering', exam_levels=['HND'], order=4),
    dict(name='Civil Engineering Technology', abbreviation='CET', subsystem=A,
         category='Technology & Engineering', exam_levels=['HND'], order=5),
    dict(name='Mechanical Engineering', abbreviation='MEC', subsystem=A,
         category='Technology & Engineering', exam_levels=['HND'], order=6),
    dict(name='Telecommunication', abbreviation='TEL', subsystem=A,
         category='Technology & Engineering', exam_levels=['HND'], order=7),

    dict(name='Accountancy', abbreviation='ACC', subsystem=A,
         category='Business, Finance & Management', exam_levels=['HND'], order=8),
    dict(name='Banking & Finance', abbreviation='BAF', subsystem=A,
         category='Business, Finance & Management', exam_levels=['HND'], order=9),
    dict(name='Marketing', abbreviation='MKT', subsystem=A,
         category='Business, Finance & Management', exam_levels=['HND'], order=10),
    dict(name='Human Resource Management', abbreviation='HRM', subsystem=A,
         category='Business, Finance & Management', exam_levels=['HND'], order=11),
    dict(name='Logistics & Transport Management', abbreviation='LTM', subsystem=A,
         category='Business, Finance & Management', exam_levels=['HND'], order=12),
    dict(name='Executive Secretarial Studies', abbreviation='ESS', subsystem=A,
         category='Business, Finance & Management', exam_levels=['HND'], order=13),
    dict(name='Project Management', abbreviation='PMT', subsystem=A,
         category='Business, Finance & Management', exam_levels=['HND'], order=14),
    dict(name='Business Administration', abbreviation='BAD', subsystem=A,
         category='Business, Finance & Management', exam_levels=['HND'], order=15),

    dict(name='Nursing', abbreviation='NUR', subsystem=A,
         category='Health & Biomedical Sciences', exam_levels=['HND'], order=16),
    dict(name='Medical Laboratory Science', abbreviation='MLS', subsystem=A,
         category='Health & Biomedical Sciences', exam_levels=['HND'], order=17),
    dict(name='Pharmacy Technology', abbreviation='PHT', subsystem=A,
         category='Health & Biomedical Sciences', exam_levels=['HND'], order=18),
    dict(name='Physiotherapy', abbreviation='PHY', subsystem=A,
         category='Health & Biomedical Sciences', exam_levels=['HND'], order=19),
    dict(name='Midwifery', abbreviation='MID', subsystem=A,
         category='Health & Biomedical Sciences', exam_levels=['HND'], order=20),
    dict(name='Public Health', abbreviation='PBH', subsystem=A,
         category='Health & Biomedical Sciences', exam_levels=['HND'], order=21),

    dict(name='Crop Production Technology', abbreviation='CPT', subsystem=A,
         category='Agro-Pastoral & Environment', exam_levels=['HND'], order=22),
    dict(name='Animal Production Technology', abbreviation='APT', subsystem=A,
         category='Agro-Pastoral & Environment', exam_levels=['HND'], order=23),
    dict(name='Agribusiness', abbreviation='AGB', subsystem=A,
         category='Agro-Pastoral & Environment', exam_levels=['HND'], order=24),
    dict(name='Forestry & Wildlife', abbreviation='FWL', subsystem=A,
         category='Agro-Pastoral & Environment', exam_levels=['HND'], order=25),

    dict(name='Hotel Management & Catering', abbreviation='HMC', subsystem=A,
         category='Tourism & Hospitality', exam_levels=['HND'], order=26),
    dict(name='Tourism & Travel Agency Management', abbreviation='TTM', subsystem=A,
         category='Tourism & Hospitality', exam_levels=['HND'], order=27),

    # ------------------------------------------------------------------ #
    # FRANCOPHONE — Enseignement Secondaire Général (MINESEC / OBC)
    # ------------------------------------------------------------------ #
    dict(name='Général', abbreviation='GEN', subsystem=F, category=GEN_FR,
         exam_levels=['BEPC'], order=1),
    # Bilingue runs from BEPC through to the Baccalauréat.
    dict(name='Bilingue', abbreviation='BIL', subsystem=F, category=GEN_FR,
         exam_levels=['BEPC', 'PROBATOIRE', 'BAC_GEN'], order=99),

    # The séries are identical at Probatoire Général and Baccalauréat Général.
    dict(name='Série A1 - Langues Anciennes', abbreviation='A1', subsystem=F, category=GEN_FR,
         exam_levels=['PROBATOIRE', 'BAC_GEN'], order=1),
    dict(name='Série A2 - Langues Vivantes', abbreviation='A2', subsystem=F, category=GEN_FR,
         exam_levels=['PROBATOIRE', 'BAC_GEN'], order=2),
    dict(name='Série A3 - Mathématiques', abbreviation='A3', subsystem=F, category=GEN_FR,
         exam_levels=['PROBATOIRE', 'BAC_GEN'], order=3),
    dict(name='Série A4 - Philosophie', abbreviation='A4', subsystem=F, category=GEN_FR,
         exam_levels=['PROBATOIRE', 'BAC_GEN'], order=4),
    dict(name='Série A5 - Langues Vivantes 2 & 3', abbreviation='A5', subsystem=F, category=GEN_FR,
         exam_levels=['PROBATOIRE', 'BAC_GEN'], order=5),
    dict(name='Série C - Mathématiques & Physique', abbreviation='C', subsystem=F, category=GEN_FR,
         exam_levels=['PROBATOIRE', 'BAC_GEN'], order=6),
    dict(name='Série D - Sciences de la Vie et de la Terre', abbreviation='D', subsystem=F,
         category=GEN_FR, exam_levels=['PROBATOIRE', 'BAC_GEN'], order=7),
    dict(name="Série TI - Technologies de l'Information", abbreviation='TI', subsystem=F,
         category=GEN_FR, exam_levels=['PROBATOIRE', 'BAC_GEN'], order=8),
    dict(name='Série AC - Art Cinématographique', abbreviation='AC', subsystem=F,
         category=GEN_FR, exam_levels=['PROBATOIRE', 'BAC_GEN'], order=9),

    # ------------------------------------------------------------------ #
    # FRANCOPHONE — Enseignement Secondaire Technique et Tertiaire
    # ------------------------------------------------------------------ #
    dict(name='Tertiaire', abbreviation='STT', subsystem=F, category=TEC_FR,
         exam_levels=['CAP'], order=1),
    dict(name='Industriel', abbreviation='IND', subsystem=F, category=TEC_FR,
         exam_levels=['CAP'], order=2),

    # Common to Probatoire Technique / STT and Baccalauréat Technique & BT.
    dict(name='Comptabilité et Gestion', abbreviation='CG', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=1),
    dict(name='Action Administrative', abbreviation='ACA', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=2),
    dict(name='Action Commerciale', abbreviation='ACC', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=3),
    dict(name='Fiscalité et Informatique de Gestion', abbreviation='FIG', subsystem=F,
         category=TEC_FR, exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=4),
    dict(name='Secrétariat Bureautique', abbreviation='SED', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=5),
    dict(name='Fabrication Mécanique', abbreviation='F1', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=6),
    dict(name='Électronique', abbreviation='F2', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=7),
    dict(name='Électrotechnique', abbreviation='F3', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=8),
    dict(name='Génie Civil - Bâtiment', abbreviation='F4-BA', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=9),
    dict(name='Génie Civil - Travaux Publics', abbreviation='F4-TP', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=10),
    dict(name='Génie Civil - Dessin', abbreviation='F4-BE', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=11),
    dict(name='Froid et Climatisation', abbreviation='F5', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=12),
    dict(name='Chimie Industrielle', abbreviation='CI', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=13),
    dict(name="Industrie de l'Habillement", abbreviation='IH', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=14),
    dict(name='Menuiserie Ébénisterie', abbreviation='MEB', subsystem=F, category=TEC_FR,
         exam_levels=['PROBATOIRE_TECH', 'BAC_TECH'], order=15),
    # Baccalauréat Technique only.
    dict(name='Chaudronnerie et Soudure', abbreviation='CHS', subsystem=F, category=TEC_FR,
         exam_levels=['BAC_TECH'], order=16),

    # ------------------------------------------------------------------ #
    # FRANCOPHONE — Enseignement Supérieur (MINESUP): BTS
    # ------------------------------------------------------------------ #
    dict(name='Génie Logiciel', abbreviation='GL', subsystem=F,
         category='Technologies & Industrie', exam_levels=['BTS'], order=1),
    dict(name='Réseaux et Sécurité', abbreviation='RS', subsystem=F,
         category='Technologies & Industrie', exam_levels=['BTS'], order=2),
    dict(name='Informatique Industrielle et Automatisme', abbreviation='IIA', subsystem=F,
         category='Technologies & Industrie', exam_levels=['BTS'], order=3),
    dict(name='Infographie et Web Design', abbreviation='IWD', subsystem=F,
         category='Technologies & Industrie', exam_levels=['BTS'], order=4),
    dict(name='Électrotechnique', abbreviation='ELT', subsystem=F,
         category='Technologies & Industrie', exam_levels=['BTS'], order=5),
    dict(name='Bâtiment', abbreviation='BA', subsystem=F,
         category='Technologies & Industrie', exam_levels=['BTS'], order=6),
    dict(name='Travaux Publics', abbreviation='TP', subsystem=F,
         category='Technologies & Industrie', exam_levels=['BTS'], order=7),
    dict(name='Froid et Climatisation', abbreviation='FC', subsystem=F,
         category='Technologies & Industrie', exam_levels=['BTS'], order=8),
    dict(name='Maintenance Industrielle', abbreviation='MI', subsystem=F,
         category='Technologies & Industrie', exam_levels=['BTS'], order=9),
    dict(name='Chaudronnerie et Soudure', abbreviation='CHS', subsystem=F,
         category='Technologies & Industrie', exam_levels=['BTS'], order=10),

    dict(name="Comptabilité et Finance d'Entreprise", abbreviation='CFE', subsystem=F,
         category='Gestion, Commerce & Droit', exam_levels=['BTS'], order=11),
    dict(name='Banque et Finance', abbreviation='BF', subsystem=F,
         category='Gestion, Commerce & Droit', exam_levels=['BTS'], order=12),
    dict(name='Marketing-Commerce-Vente', abbreviation='MCV', subsystem=F,
         category='Gestion, Commerce & Droit', exam_levels=['BTS'], order=13),
    dict(name='Commerce International', abbreviation='CI', subsystem=F,
         category='Gestion, Commerce & Droit', exam_levels=['BTS'], order=14),
    dict(name='Transport et Logistique', abbreviation='TL', subsystem=F,
         category='Gestion, Commerce & Droit', exam_levels=['BTS'], order=15),
    dict(name='Douane et Transit', abbreviation='DOT', subsystem=F,
         category='Gestion, Commerce & Droit', exam_levels=['BTS'], order=16),
    dict(name='Communication des Organisations', abbreviation='CO', subsystem=F,
         category='Gestion, Commerce & Droit', exam_levels=['BTS'], order=17),
    dict(name='Droit des Affaires', abbreviation='DAE', subsystem=F,
         category='Gestion, Commerce & Droit', exam_levels=['BTS'], order=18),
    dict(name='Gestion des Projets', abbreviation='GPR', subsystem=F,
         category='Gestion, Commerce & Droit', exam_levels=['BTS'], order=19),

    dict(name='Soins Infirmiers', abbreviation='SI', subsystem=F,
         category='Santé & Paramédical', exam_levels=['BTS'], order=20),
    dict(name='Techniques de Laboratoire', abbreviation='TLAB', subsystem=F,
         category='Santé & Paramédical', exam_levels=['BTS'], order=21),
    dict(name='Radiologie et Imagerie Médicale', abbreviation='RIM', subsystem=F,
         category='Santé & Paramédical', exam_levels=['BTS'], order=22),
    dict(name='Sage-Femme', abbreviation='SF', subsystem=F,
         category='Santé & Paramédical', exam_levels=['BTS'], order=23),
    dict(name='Pharmacie', abbreviation='PHAR', subsystem=F,
         category='Santé & Paramédical', exam_levels=['BTS'], order=24),

    dict(name='Biotechnologie Agricole', abbreviation='BTA', subsystem=F,
         category='Agropastoral & Environnement', exam_levels=['BTS'], order=25),
    dict(name='Production Végétale', abbreviation='PV', subsystem=F,
         category='Agropastoral & Environnement', exam_levels=['BTS'], order=26),
    dict(name='Production Animale', abbreviation='PA', subsystem=F,
         category='Agropastoral & Environnement', exam_levels=['BTS'], order=27),
    dict(name="Génie de l'Environnement", abbreviation='GEN', subsystem=F,
         category='Agropastoral & Environnement', exam_levels=['BTS'], order=28),

    # ------------------------------------------------------------------ #
    # NATIONAL CONCOURS — open to both subsystems
    # ------------------------------------------------------------------ #
    dict(name='Génie Informatique', abbreviation='GI', subsystem=B,
         category='ENSP / Polytechnique', exam_levels=['CONCOURS_ENSP'], order=1),
    dict(name='Génie Civil', abbreviation='GC', subsystem=B,
         category='ENSP / Polytechnique', exam_levels=['CONCOURS_ENSP'], order=2),
    dict(name='Génie Électrique', abbreviation='GE', subsystem=B,
         category='ENSP / Polytechnique', exam_levels=['CONCOURS_ENSP'], order=3),
    dict(name='Génie Mécanique', abbreviation='GM', subsystem=B,
         category='ENSP / Polytechnique', exam_levels=['CONCOURS_ENSP'], order=4),
    dict(name='Génie Chimique', abbreviation='GCH', subsystem=B,
         category='ENSP / Polytechnique', exam_levels=['CONCOURS_ENSP'], order=5),
    dict(name='Génie Télécommunications', abbreviation='GTL', subsystem=B,
         category='ENSP / Polytechnique', exam_levels=['CONCOURS_ENSP'], order=6),

    dict(name='Médecine Générale', abbreviation='MED', subsystem=B,
         category='FMSB / CUSS', exam_levels=['CONCOURS_FMSB'], order=1),
    dict(name='Pharmacie', abbreviation='PHA', subsystem=B,
         category='FMSB / CUSS', exam_levels=['CONCOURS_FMSB'], order=2),
    dict(name='Odontostomatologie', abbreviation='ODO', subsystem=B,
         category='FMSB / CUSS', exam_levels=['CONCOURS_FMSB'], order=3),

    dict(name='Lettres & Sciences Humaines', abbreviation='LSH', subsystem=B,
         category='ENS', exam_levels=['CONCOURS_ENS'], order=1),
    dict(name='Sciences Exactes', abbreviation='SCE', subsystem=B,
         category='ENS', exam_levels=['CONCOURS_ENS'], order=2),
    dict(name="Sciences de l'Éducation", abbreviation='SED', subsystem=B,
         category='ENS', exam_levels=['CONCOURS_ENS'], order=3),

    dict(name='Magistrature', abbreviation='MAG', subsystem=B,
         category='ENAM', exam_levels=['CONCOURS_ENAM'], order=1),
    dict(name='Greffe', abbreviation='GRE', subsystem=B,
         category='ENAM', exam_levels=['CONCOURS_ENAM'], order=2),
    dict(name='Administration Générale', abbreviation='AG', subsystem=B,
         category='ENAM', exam_levels=['CONCOURS_ENAM'], order=3),
    dict(name='Régies Financières', abbreviation='RF', subsystem=B,
         category='ENAM', exam_levels=['CONCOURS_ENAM'], order=4),

    dict(name="Infirmiers Diplômés d'État", abbreviation='IDE', subsystem=B,
         category='Santé Publique', exam_levels=['CONCOURS_SANTE'], order=1),
    dict(name='Sages-Femmes', abbreviation='SF', subsystem=B,
         category='Santé Publique', exam_levels=['CONCOURS_SANTE'], order=2),
    dict(name='Techniciens Médico-Sanitaires', abbreviation='TMS', subsystem=B,
         category='Santé Publique', exam_levels=['CONCOURS_SANTE'], order=3),
]
# =============================================================================

# Exam codes a student can actually hold (User.EXAM_CHOICES). Keep in sync.
EXAM_CODES = {
    'GCE_OL', 'GCE_AL', 'GCE_TVE_OL', 'GCE_TVE_AL', 'HND',
    'CEP', 'BEPC', 'PROBATOIRE', 'BAC_GEN',
    'CAP', 'PROBATOIRE_TECH', 'BAC_TECH', 'BTS',
    'CONCOURS_ENSP', 'CONCOURS_FMSB', 'CONCOURS_ENS', 'CONCOURS_ENAM', 'CONCOURS_SANTE',
    # Legacy, still valid on existing profiles.
    'BAC_A', 'BAC_C', 'BAC_D', 'BAC_E',
}
SUBSYSTEMS = {'anglophone', 'francophone', 'bilingual'}


class Command(BaseCommand):
    help = 'Seeds the specialty catalogue from the list in this file.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--prune', action='store_true',
            help='Delete catalogue rows that are no longer in the list.',
        )

    def validate(self, entries):
        """Fail loudly on typos rather than seeding unreachable specialties."""
        errors = []
        seen_codes = {}
        for i, s in enumerate(entries):
            where = f'entry #{i + 1} ({s.get("name", "unnamed")!r})'
            for key in ('name', 'abbreviation', 'subsystem', 'exam_levels'):
                if not s.get(key):
                    errors.append(f'{where}: missing "{key}"')
            if s.get('subsystem') and s['subsystem'] not in SUBSYSTEMS:
                errors.append(f'{where}: subsystem must be one of {sorted(SUBSYSTEMS)}')
            for exam in s.get('exam_levels') or []:
                if exam not in EXAM_CODES:
                    errors.append(
                        f'{where}: unknown exam code {exam!r}. '
                        f'Valid codes: {", ".join(sorted(EXAM_CODES))}. '
                        f'Add it to User.EXAM_CHOICES first if it is a new exam.'
                    )
            if not s.get('exam_levels') or not s.get('abbreviation'):
                continue
            code = build_specialty_code(s['exam_levels'], s['abbreviation'])
            if code in seen_codes:
                errors.append(
                    f'{where}: code {code!r} collides with {seen_codes[code]!r}. '
                    f'Two specialties in the same exam share an abbreviation.'
                )
            seen_codes[code] = s['name']
        return errors

    @transaction.atomic
    def handle(self, *args, **options):
        if not SPECIALTIES:
            self.stdout.write(self.style.WARNING(
                'The specialty catalogue is empty — nothing to seed. Registration\n'
                'still works: the dropdown offers "Other" so students can type their own.'
            ))
            return

        errors = self.validate(SPECIALTIES)
        if errors:
            self.stderr.write(self.style.ERROR(f'{len(errors)} problem(s) in the catalogue:'))
            for e in errors:
                self.stderr.write(f'  - {e}')
            raise SystemExit(1)

        created = updated = 0
        for spec in SPECIALTIES:
            code = build_specialty_code(spec['exam_levels'], spec['abbreviation'])
            _, was_created = Specialty.objects.update_or_create(
                code=code, defaults=spec,
            )
            created += was_created
            updated += not was_created

        if options['prune']:
            keep = {build_specialty_code(s['exam_levels'], s['abbreviation']) for s in SPECIALTIES}
            stale = Specialty.objects.exclude(code__in=keep)
            for s in stale:
                self.stdout.write(self.style.WARNING(f'Deleting: {s}'))
            count = stale.count()
            stale.delete()
            if count:
                self.stdout.write(f'Pruned {count} row(s).')

        total = Specialty.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f'Specialty catalogue seeded — {created} created, {updated} updated, {total} total.'
        ))
