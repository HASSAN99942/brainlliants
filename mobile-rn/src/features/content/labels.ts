/** Django EXAM_CHOICES codes -> display labels (apps/content/models.py). */
export const EXAM_LABEL: Record<string, string> = {
  // Anglophone
  GCE_OL: 'GCE O/L',
  GCE_AL: 'GCE A/L',
  GCE_TVE_OL: 'GCE TVE (O/L)',
  GCE_TVE_AL: 'GCE TVE (A/L)',
  HND: 'HND',
  // Francophone
  CEP: 'CEP',
  BEPC: 'BEPC',
  PROBATOIRE: 'Probatoire Général',
  BAC_GEN: 'Baccalauréat Général',
  CAP: 'CAP',
  PROBATOIRE_TECH: 'Probatoire Technique',
  BAC_TECH: 'Baccalauréat Technique',
  BTS: 'BTS',
  // National concours
  CONCOURS_ENSP: 'Concours ENSP',
  CONCOURS_FMSB: 'Concours FMSB',
  CONCOURS_ENS: 'Concours ENS',
  CONCOURS_ENAM: 'Concours ENAM',
  CONCOURS_SANTE: 'Concours Santé Publique',
  // Legacy, superseded by BAC_GEN + série specialties
  BAC_A: 'BAC A',
  BAC_C: 'BAC C',
  BAC_D: 'BAC D',
  BAC_E: 'BAC E',
};

/**
 * Quick filters above the paper list.
 *   MINE — the student's own specialty (backend default)
 *   ALL  — the whole bank
 *   anything else — an exam code, browsed across all specialties
 */
export const FILTER_MINE = 'Mine';
export const FILTER_ALL = 'All';

export const FILTERS = [FILTER_MINE, FILTER_ALL, 'GCE_AL', 'HND', 'BAC_GEN', 'BEPC'];

export const FILTER_LABEL: Record<string, string> = {
  [FILTER_MINE]: 'My specialty',
  [FILTER_ALL]: 'All exams',
  GCE_AL: 'GCE A/L',
  HND: 'HND',
  BAC_GEN: 'Bac Général',
  BEPC: 'BEPC',
};

/** Turn a filter chip into query params for the paper endpoints. */
export function filterToQuery(filter: string): { scope: 'mine' | 'all'; exam_type?: string } {
  if (filter === FILTER_MINE) return { scope: 'mine' };
  if (filter === FILTER_ALL) return { scope: 'all' };
  return { scope: 'all', exam_type: filter };
}

export function sizeLabel(kb?: number | null): string {
  return `${((kb ?? 0) / 1024).toFixed(1)} MB`;
}
