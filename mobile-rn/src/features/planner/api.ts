import { api } from '../../core/network/apiClient';
import { Endpoints } from '../../core/constants/api';

export interface TimetableEntry {
  day: number;    // 0 = Monday
  slot: number;   // index into the screen's TIMES array
  subject: string;
  color: number;  // index into the screen's COLORS array
}

export interface WeekDay {
  date: string;
  label: string;
  minutes: number;
  is_today: boolean;
}

export interface Progress {
  streak: number;
  best_streak: number;
  total_hours: number;
  quizzes_this_month: number;
  ai_used: number;
  ai_limit: number | null;
  week: WeekDay[];
}

export interface ChatHistoryMessage {
  id: string;
  body: string;
  sender_id: string;
  sender_name: string;
  is_teacher: boolean;
  created_at: string;
}

export const plannerApi = {
  async getTimetable() {
    const { data } = await api.get(Endpoints.timetable);
    return (data.entries ?? []) as TimetableEntry[];
  },
  async saveTimetable(entries: TimetableEntry[]) {
    const { data } = await api.put(Endpoints.timetable, { entries });
    return (data.entries ?? []) as TimetableEntry[];
  },
  async getProgress() {
    const { data } = await api.get(Endpoints.progress);
    return data as Progress;
  },
  /** The backend rejects non-integer or non-positive minutes with 400. */
  async logSession(minutes: number) {
    await api.post(Endpoints.logSession, { minutes: Math.round(minutes) });
  },
  /** 403 if you are not a member of the group. */
  async getChatHistory(groupId: string) {
    const { data } = await api.get(`${Endpoints.groups}${groupId}/chat-history/`);
    return data as ChatHistoryMessage[];
  },
  async registerFcmToken(token: string) {
    await api.post(Endpoints.fcmToken, { token });
  },
};
