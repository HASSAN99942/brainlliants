export interface UserModel {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: 'student' | 'teacher' | 'school_admin' | 'super_admin';
  subsystem?: string | null;
  exam_level?: string | null;
  specialty?: string | null;
  /** Catalogue Specialty id, or null when the specialty was typed by hand. */
  specialty_ref?: string | null;
  institution?: string | null;
  subjects_taught: string[];
  years_experience?: number | null;
  interface_language: 'en' | 'fr';
  is_verified: boolean;
  is_teacher_verified: boolean;
  is_pro: boolean;
  pro_expiry?: string | null;
  profile_photo_url?: string | null;
}

export function fullName(u: UserModel) { return `${u.first_name} ${u.last_name}`; }
export function initials(u: UserModel) {
  return `${u.first_name[0] ?? ''}${u.last_name[0] ?? ''}`.toUpperCase();
}
