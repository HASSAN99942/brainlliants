import { api } from '../../core/network/apiClient';
import { Endpoints } from '../../core/constants/api';

/**
 * One shape for both Questions and Notes.
 *
 * The Django `Note` model has no `year` and no `format` column (see
 * apps/content/models.py), so those two fields are optional here and the note
 * cards simply omit them.
 */
export interface Paper {
  id: string;
  title: string;
  exam_type: string;
  subject: string;
  specialty?: string;
  year?: number | null;
  format?: 'pdf' | 'json' | 'both';
  language: string;
  is_public: boolean;
  file_size_kb?: number | null;
  download_count: number;
  is_bookmarked: boolean;
  created_at: string;
  pdf_url?: string | null;
  json_data?: { questions?: unknown[] } | null;
}

export interface DownloadInfo {
  used: number;
  limit: number | null;
  is_pro: boolean;
  can_download: boolean;
}

export type PaperDetail = Paper & { download_info: DownloadInfo };

export interface Bookmark {
  id: string;
  content_type: 'question' | 'note';
  question?: Paper | null;
  note?: Paper | null;
  created_at: string;
}

interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BrowseSpecialty {
  id: string;
  name: string;
  abbreviation: string;
  category: string;
}

/**
 * `scope` defaults to 'mine' on the backend — the student's own specialty plus
 * general papers of their exam. Passing an explicit `specialty` always wins,
 * which is how the browse explorer drills in.
 */
export interface PaperQuery {
  scope?: 'mine' | 'all';
  specialty?: string;
  exam?: string;
  exam_type?: string;
  year?: string;
  search?: string;
  ordering?: string;
  page?: number;
}

export const contentApi = {
  async getQuestions(params: PaperQuery) {
    const { data } = await api.get(Endpoints.questions, { params });
    return data as Page<Paper>;
  },

  async browseExams(subsystem: string) {
    const { data } = await api.get(Endpoints.browseExams, { params: { subsystem } });
    return data as string[];
  },
  async browseSpecialties(subsystem: string, exam: string) {
    const { data } = await api.get(Endpoints.browseSpecialties, { params: { subsystem, exam } });
    return data as BrowseSpecialty[];
  },
  async browseYears(specialty: string, exam: string) {
    const { data } = await api.get(Endpoints.browseYears, { params: { specialty, exam } });
    return data as number[];
  },
  async getQuestionDetail(id: string) {
    const { data } = await api.get(`${Endpoints.questions}${id}/`);
    return data as PaperDetail;
  },
  async requestQuestionDownload(id: string) {
    const { data } = await api.post(`${Endpoints.questions}${id}/download/`);
    return data as { pdf_url: string | null; json_data?: unknown };
  },
  async getNotes(params: PaperQuery) {
    const { data } = await api.get(Endpoints.notes, { params });
    return data as Page<Paper>;
  },
  async requestNoteDownload(id: string) {
    const { data } = await api.post(`${Endpoints.notes}${id}/download/`);
    return data as { pdf_url: string | null };
  },
  async getBookmarks() {
    const { data } = await api.get(Endpoints.bookmarks);
    return data as Bookmark[];
  },
  async toggleBookmark(contentType: 'question' | 'note', id: string) {
    const { data } = await api.post(Endpoints.bookmarkToggle, { content_type: contentType, id });
    return data.bookmarked as boolean;
  },
};

/** True when the backend refused a download because the free monthly cap is hit. */
export function isLimitReached(e: unknown): boolean {
  const err = e as { response?: { status?: number } };
  return err?.response?.status === 403;
}
