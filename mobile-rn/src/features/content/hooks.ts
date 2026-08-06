import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from './api';
import { filterToQuery } from './labels';

export function useQuestions(filter: string, search: string, ordering: string) {
  return useQuery({
    queryKey: ['questions', filter, search, ordering],
    queryFn: () => contentApi.getQuestions({
      ...filterToQuery(filter),
      search: search || undefined,
      ordering,
    }),
  });
}

export function useNotes(filter: string, search: string) {
  return useQuery({
    queryKey: ['notes', filter, search],
    queryFn: () => contentApi.getNotes({
      ...filterToQuery(filter),
      search: search || undefined,
    }),
  });
}

export function useQuestionDetail(id: string) {
  return useQuery({
    queryKey: ['question', id],
    queryFn: () => contentApi.getQuestionDetail(id),
    enabled: !!id,
  });
}

export function useBookmarks() {
  return useQuery({ queryKey: ['bookmarks'], queryFn: contentApi.getBookmarks });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { type: 'question' | 'note'; id: string }) =>
      contentApi.toggleBookmark(args.type, args.id),
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] });
      qc.invalidateQueries({ queryKey: ['question', args.id] });
    },
  });
}
