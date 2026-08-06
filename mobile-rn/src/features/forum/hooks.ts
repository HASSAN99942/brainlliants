import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumApi, ForumScope } from './api';

export function useForumFeed(scope: ForumScope, filter: string, search: string) {
  return useQuery({
    queryKey: ['forum', scope, filter, search],
    queryFn: () => forumApi.getPosts(scope, filter, search),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, body, scope }: { title: string; body: string; scope?: ForumScope }) =>
      forumApi.createPost(title, body, scope ?? 'general'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum'] }),
  });
}
