import { api } from '../../core/network/apiClient';
import { Endpoints } from '../../core/constants/api';

export interface Group {
  id: string;
  name: string;
  description: string;
  exam_type: string;
  subject: string;
  language: string;
  member_count: number;
  is_member: boolean;
  initials: string;
}

export interface GroupPost {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface UserResult {
  id: string;
  display_name: string;
  initials: string;
  role: string;
  is_teacher: boolean;
  exam_level?: string | null;
  specialty?: string | null;
  profile_photo_url?: string | null;
}

export const communityApi = {
  async getGroups(language?: string) {
    const { data } = await api.get(Endpoints.groups, { params: language ? { language } : {} });
    return data as Group[];
  },
  async toggleJoin(groupId: string) {
    const { data } = await api.post(`${Endpoints.groups}${groupId}/join/`);
    return data as { is_member: boolean; member_count: number };
  },
  async getGroupPosts(groupId: string) {
    const { data } = await api.get(`${Endpoints.groups}${groupId}/posts/`);
    return data as GroupPost[];
  },
  async createGroupPost(groupId: string, body: string) {
    const { data } = await api.post(`${Endpoints.groups}${groupId}/posts/`, { body });
    return data as GroupPost;
  },
  async searchUsers(q: string) {
    const { data } = await api.get(Endpoints.userSearch, { params: { q } });
    return data as UserResult[];
  },
};

/** The backend refuses group posts from non-members with 403. */
export function isNotMember(e: unknown): boolean {
  const err = e as { response?: { status?: number } };
  return err?.response?.status === 403;
}
