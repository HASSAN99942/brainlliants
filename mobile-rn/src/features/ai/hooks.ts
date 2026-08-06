import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi, ChatMessage } from './api';

export function useUsage() {
  return useQuery({ queryKey: ['ai-usage'], queryFn: aiApi.getUsage });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messages: ChatMessage[]) => aiApi.chat(messages),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-usage'] }),
  });
}

export function useSummarise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { uri: string; name: string; mime: string; lang: 'en' | 'fr' }) =>
      aiApi.summarise(args.uri, args.name, args.mime, args.lang),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-usage'] }),
  });
}

export function useSaveQuizResult() {
  return useMutation({ mutationFn: aiApi.saveQuizResult });
}
