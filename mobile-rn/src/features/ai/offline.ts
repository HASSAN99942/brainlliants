import { cache, storage } from '../../core/storage/cache';

const PREFIX = 'ai_summary:';

export interface SavedSummary {
  session_id: string; summary: string; explanation: string;
  questions: unknown[]; file_name: string; saved_at: string;
}

export const summaryCache = {
  save(s: SavedSummary) { cache.set(`${PREFIX}${s.session_id}`, s); },
  list(): SavedSummary[] {
    return storage.getAllKeys()
      .filter((k) => k.startsWith(PREFIX))
      .map((k) => cache.get<SavedSummary>(k))
      .filter((x): x is SavedSummary => !!x)
      .sort((a, b) => b.saved_at.localeCompare(a.saved_at));
  },
};
