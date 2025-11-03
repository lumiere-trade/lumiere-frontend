/**
 * Legal Documents Query Hooks
 * React Query hooks for legal documents
 */
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { transformLegalDocument } from '@/types/ui.types'
import type { LegalDocument } from '@/types/ui.types'

export const LEGAL_QUERY_KEYS = {
  documents: ['legal', 'documents'] as const,
}

export function useLegalDocumentsQuery() {
  return useQuery<LegalDocument[]>({
    queryKey: LEGAL_QUERY_KEYS.documents,
    queryFn: async () => {
      const apiDocs = await authApi.getLegalDocuments()
      return apiDocs.map(transformLegalDocument)
    },
    staleTime: 30 * 60 * 1000,
    retry: 2,
  })
}
