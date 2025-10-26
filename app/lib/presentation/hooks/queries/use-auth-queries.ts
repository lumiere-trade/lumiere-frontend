/**
 * Auth Query Hooks.
 * React Query hooks for auth-related data fetching.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { container } from '@/lib/infrastructure/di/container';
import { User } from '@/lib/domain/entities/user.entity';
import { PendingDocument } from '@/lib/domain/entities/pending-document.entity';

export const AUTH_QUERY_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
  compliance: ['auth', 'compliance'] as const,
};

interface ComplianceCheckResult {
  missingDocuments: PendingDocument[];
}

export function useCurrentUserQuery(
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>
) {
  const authService = container.authService;

  return useQuery<User>({
    queryKey: AUTH_QUERY_KEYS.currentUser,
    queryFn: async () => {
      return await authService.getCurrentUser();
    },
    enabled: authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    ...options,
  });
}

export function useComplianceCheckQuery(
  options?: Omit<UseQueryOptions<ComplianceCheckResult>, 'queryKey' | 'queryFn'>
) {
  const authService = container.authService;

  return useQuery<ComplianceCheckResult>({
    queryKey: AUTH_QUERY_KEYS.compliance,
    queryFn: async () => {
      const missingDocuments = await authService.checkCompliance();
      return { missingDocuments };
    },
    enabled: authService.isAuthenticated(),
    staleTime: 10 * 60 * 1000,
    retry: 1,
    ...options,
  });
}
