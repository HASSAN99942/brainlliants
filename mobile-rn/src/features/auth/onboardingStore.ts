import { create } from 'zustand';

interface OnboardingState {
  subsystem: 'anglophone' | 'francophone' | null;
  examLevel: string | null;
  setSubsystem: (s: 'anglophone' | 'francophone') => void;
  setExamLevel: (e: string) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  subsystem: null,
  examLevel: null,
  setSubsystem: (subsystem) => set({ subsystem, examLevel: null }),
  setExamLevel: (examLevel) => set({ examLevel }),
}));

// National competitive entrance exams — sat by students from both subsystems,
// so they appear at the end of each list.
export const CONCOURS_EXAMS = [
  'Concours ENSP',
  'Concours FMSB',
  'Concours ENS',
  'Concours ENAM',
  'Concours Santé Publique',
];

export const ANGLO_EXAMS = [
  'GCE O/L',
  'GCE A/L',
  'GCE TVE Intermediate',
  'GCE TVE Advanced',
  'HND',
  ...CONCOURS_EXAMS,
];

export const FRANCO_EXAMS = [
  'CEP',
  'BEPC',
  'Probatoire Général',
  'Baccalauréat Général',
  'CAP',
  'Probatoire Technique',
  'Baccalauréat Technique',
  'BTS',
  ...CONCOURS_EXAMS,
];

// Map UI label → backend exam_level code (User.EXAM_CHOICES).
export const EXAM_CODE: Record<string, string> = {
  // Anglophone
  'GCE O/L': 'GCE_OL',
  'GCE A/L': 'GCE_AL',
  'GCE TVE Intermediate': 'GCE_TVE_OL',
  'GCE TVE Advanced': 'GCE_TVE_AL',
  'HND': 'HND',
  // Francophone
  'CEP': 'CEP',
  'BEPC': 'BEPC',
  'Probatoire Général': 'PROBATOIRE',
  'Baccalauréat Général': 'BAC_GEN',
  'CAP': 'CAP',
  'Probatoire Technique': 'PROBATOIRE_TECH',
  'Baccalauréat Technique': 'BAC_TECH',
  'BTS': 'BTS',
  // National concours
  'Concours ENSP': 'CONCOURS_ENSP',
  'Concours FMSB': 'CONCOURS_FMSB',
  'Concours ENS': 'CONCOURS_ENS',
  'Concours ENAM': 'CONCOURS_ENAM',
  'Concours Santé Publique': 'CONCOURS_SANTE',
};
