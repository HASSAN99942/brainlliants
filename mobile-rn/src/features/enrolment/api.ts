import { api } from '../../core/network/apiClient';
import { Endpoints } from '../../core/constants/api';

export type EnrolmentStatus = 'pending' | 'approved' | 'rejected';

export interface School {
  id: string;
  name: string;
  /** Serialiser alias for the model's `city` column. */
  town: string;
  region: string | null;
  subsystem: string;
  school_type: string;
  student_count: number;
}

export interface Enrolment {
  id: string;
  school: School;
  student_name: string;
  student_email: string;
  matricule: string;
  status: EnrolmentStatus;
  /** Serialiser alias for the model's `created_at` column. */
  requested_at: string;
  reviewed_at: string | null;
}

export const enrolmentApi = {
  async searchSchools(q: string, subsystem?: string): Promise<School[]> {
    const { data } = await api.get(Endpoints.schoolSearch, {
      params: { q, ...(subsystem ? { subsystem } : {}) },
    });
    return data as School[];
  },

  async myEnrolments(): Promise<Enrolment[]> {
    const { data } = await api.get(Endpoints.enrolments);
    return data as Enrolment[];
  },

  async requestEnrolment(schoolId: string, matricule: string): Promise<Enrolment> {
    const { data } = await api.post(Endpoints.enrolmentRequest, {
      school_id: schoolId,
      matricule,
    });
    return data as Enrolment;
  },
};

/** Pull the backend's `{error: "..."}` message out of an Axios failure. */
export function enrolmentError(e: unknown, fallback = 'Could not send request. Try again.'): string {
  const data = (e as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const err = (data as Record<string, unknown>).error;
    if (typeof err === 'string') return err;
    // DRF field errors, e.g. {matricule: ["Matricule is required."]}
    const first = Object.values(data as Record<string, unknown>)[0];
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
  }
  return fallback;
}
