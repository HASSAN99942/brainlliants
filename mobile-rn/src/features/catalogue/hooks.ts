import { useQuery } from '@tanstack/react-query';
import { catalogueApi } from './api';

export function useSpecialties(subsystem?: string, exam?: string) {
  return useQuery({
    queryKey: ['specialties', subsystem, exam],
    queryFn: () => catalogueApi.getSpecialties(subsystem!, exam!),
    enabled: !!subsystem && !!exam,
    // The catalogue changes rarely — no need to refetch on every mount.
    staleTime: 60 * 60 * 1000,
  });
}
