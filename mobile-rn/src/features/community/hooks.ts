import { useQuery } from '@tanstack/react-query';
import { communityApi } from './api';

export function useGroups(language?: string) {
  return useQuery({
    queryKey: ['groups', language ?? 'all'],
    queryFn: () => communityApi.getGroups(language),
  });
}

export function useGroupPosts(groupId: string) {
  return useQuery({
    queryKey: ['group-posts', groupId],
    queryFn: () => communityApi.getGroupPosts(groupId),
    enabled: !!groupId,
  });
}
