import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrolmentApi } from './api';

export function useMyEnrolments() {
  return useQuery({
    queryKey: ['enrolments'],
    queryFn: () => enrolmentApi.myEnrolments(),
  });
}

export function useRequestEnrolment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, matricule }: { schoolId: string; matricule: string }) =>
      enrolmentApi.requestEnrolment(schoolId, matricule),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrolments'] });
      // Approved schools widen what content is visible.
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
