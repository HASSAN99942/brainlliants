import { api } from '../../core/network/apiClient';
import { Endpoints } from '../../core/constants/api';

export interface ChatMessage { role: 'user' | 'model'; content: string; }
export interface QuizQuestion {
  question: string; options: string[]; correct_option: number; explanation?: string;
}

export const aiApi = {
  async chat(messages: ChatMessage[]) {
    const { data } = await api.post(Endpoints.aiChat, { messages });
    return data as { session_id: string; reply: string; usage: UsageInfo };
  },
  async summarise(fileUri: string, fileName: string, mimeType: string, language: 'en' | 'fr') {
    const form = new FormData();
    // React Native FormData file shape
    form.append('file', { uri: fileUri, name: fileName, type: mimeType } as any);
    form.append('language', language);
    const { data } = await api.post(Endpoints.aiSummarise, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data as { session_id: string; summary: string; explanation: string; questions: QuizQuestion[] };
  },
  async saveQuizResult(payload: {
    source_type: string; ai_session_id?: string | null;
    total_questions: number; correct_answers: number; score_percent: string; answers_json: unknown[];
  }) {
    const { data } = await api.post(Endpoints.aiQuizResult, payload);
    return data;
  },
  async getUsage() {
    const { data } = await api.get(Endpoints.aiUsage);
    return data as UsageInfo;
  },
};

export interface UsageInfo { used: number; limit: number | null; is_pro: boolean; remaining: number | null; }
