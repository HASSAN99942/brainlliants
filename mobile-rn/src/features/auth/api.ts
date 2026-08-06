import { api } from '../../core/network/apiClient';
import { Endpoints } from '../../core/constants/api';
import { tokenStore } from '../../core/storage/secureStore';
import { UserModel } from '../../shared/types/user';

export interface RegisterStudentPayload {
  first_name: string; last_name: string; email: string; phone: string;
  password: string; confirm_password: string; specialty?: string;
  /** Catalogue Specialty UUID; null when the student typed their own. */
  specialty_ref?: string | null;
  subsystem?: string; exam_level?: string; interface_language: 'en' | 'fr';
}
export interface RegisterTeacherPayload {
  first_name: string; last_name: string; email: string; phone: string;
  password: string; confirm_password: string; institution?: string;
  subjects_taught: string[]; interface_language: 'en' | 'fr';
}

export const authApi = {
  async registerStudent(payload: RegisterStudentPayload) {
    const { data } = await api.post(Endpoints.registerStudent, payload);
    return data as { user_id: string; email: string; message: string };
  },
  async registerTeacher(payload: RegisterTeacherPayload) {
    const { data } = await api.post(Endpoints.registerTeacher, payload);
    return data as { user_id: string; email: string; message: string };
  },
  async verifyOtp(userId: string, otpCode: string) {
    const { data } = await api.post(Endpoints.verifyOtp, { user_id: userId, otp_code: otpCode });
    await tokenStore.saveTokens(data.access, data.refresh);
    return data.user as UserModel;
  },
  async resendOtp(userId: string) {
    await api.post(Endpoints.resendOtp, { user_id: userId });
  },
  async login(email: string, password: string) {
    const { data } = await api.post(Endpoints.login, { email, password });
    await tokenStore.saveTokens(data.access, data.refresh);
    return data.user as UserModel;
  },
  async logout() {
    const refresh = await tokenStore.getRefresh();
    try { await api.post(Endpoints.logout, { refresh }); } catch { /* ignore */ }
    await tokenStore.clear();
  },
  async getProfile() {
    const { data } = await api.get(Endpoints.profile);
    return data as UserModel;
  },
  /** Backend expects `{language}` and echoes `{language}` — not a full profile. */
  async changeLanguage(language: 'en' | 'fr') {
    const { data } = await api.patch(Endpoints.changeLanguage, { language });
    return (data as { language: 'en' | 'fr' }).language;
  },
};

// Parse DRF error responses into a single readable string
export function parseApiError(e: any): string {
  const data = e?.response?.data;
  if (!data) return 'Something went wrong. Please try again.';
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  const val = data[firstKey];
  if (Array.isArray(val)) return val[0];
  if (typeof val === 'string') return val;
  return 'Please check your details and try again.';
}
