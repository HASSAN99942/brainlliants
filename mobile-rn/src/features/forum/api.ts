import { api } from '../../core/network/apiClient';
import { Endpoints } from '../../core/constants/api';

export interface Author {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  initials: string;
  role: string;
  is_teacher: boolean;
  exam_level?: string | null;
}

export type ForumScope = 'general' | 'exam' | 'specialty';

export interface ForumPost {
  id: string;
  author: Author;
  title: string;
  body: string;
  ai_answer: string | null;
  view_count: number;
  reply_count: number;
  is_resolved: boolean;
  scope: ForumScope;
  /** Exam code when scope === 'exam'. */
  scope_exam: string;
  /** Specialty id when scope === 'specialty'. */
  scope_specialty: string | null;
  scope_specialty_name: string | null;
  created_at: string;
}

export interface ForumReply {
  id: string;
  author: Author;
  body: string;
  upvote_count: number;
  is_best_answer: boolean;
  user_has_upvoted: boolean;
  created_at: string;
}

export type ForumPostDetail = ForumPost & { replies: ForumReply[] };

interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const forumApi = {
  async getPosts(scope: ForumScope, filter?: string, search?: string) {
    const params: Record<string, string> = { scope };
    if (filter && filter !== 'all') params.filter = filter;
    if (search) params.search = search;
    const { data } = await api.get(Endpoints.forumPosts, { params });
    return data as Page<ForumPost>;
  },
  async getPost(id: string) {
    const { data } = await api.get(`${Endpoints.forumPosts}${id}/`);
    return data as ForumPostDetail;
  },
  /**
   * Only `scope` is sent — the backend fills scope_exam / scope_specialty from
   * the profile, so a post cannot be planted in someone else's room.
   */
  async createPost(title: string, body: string, scope: ForumScope = 'general') {
    const { data } = await api.post(Endpoints.forumPosts, { title, body, scope });
    return data as ForumPost;
  },
  async reply(postId: string, body: string) {
    const { data } = await api.post(`${Endpoints.forumPosts}${postId}/replies/`, { body });
    return data as ForumReply;
  },
  async upvote(replyId: string) {
    const { data } = await api.post(`/forum/replies/${replyId}/upvote/`);
    return data as { user_has_upvoted: boolean; upvote_count: number };
  },
  async markBest(replyId: string) {
    await api.post(`/forum/replies/${replyId}/best/`);
  },
};
