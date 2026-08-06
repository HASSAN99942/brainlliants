import { api } from '../../core/network/apiClient';
import { Endpoints } from '../../core/constants/api';

export interface Specialty {
  id: string;
  /** Stable natural key, e.g. 'hnd-swe'. */
  code: string;
  name: string;
  abbreviation: string;
  subsystem: string;
  exam_levels: string[];
  /** Grouping within an exam, e.g. 'Health & Biomedical Sciences'. May be ''. */
  category: string;
  is_general: boolean;
}

export const catalogueApi = {
  /** Public endpoint — reachable during registration, before there is a token. */
  async getSpecialties(subsystem: string, exam: string): Promise<Specialty[]> {
    const { data } = await api.get(Endpoints.specialties, { params: { subsystem, exam } });
    return data as Specialty[];
  },
};
