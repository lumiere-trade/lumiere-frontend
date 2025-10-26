/**
 * Legal Documents Query Hooks.
 * React Query hooks for legal documents data fetching.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { container } from '@/lib/infrastructure/di/container';
import { LegalDocument } from '@/lib/domain/entities/legal-document.entity';

export const LEGAL_QUERY_KEYS = {
  documents: ['legal', 'documents'] as const,
};

export function useLegalDocumentsQuery(
  options?: Omit<UseQueryOptions<LegalDocument[]>, 'queryKey' | 'queryFn'>
) {
  const legalService = container.legalService;

  return useQuery<LegalDocument[]>({
    queryKey: LEGAL_QUERY_KEYS.documents,
    queryFn: async () => {
      return await legalService.getActiveLegalDocuments();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (legal docs don't change often)
    retry: 2,
    ...options,
  });
}
