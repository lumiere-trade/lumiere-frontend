/**
 * Auth Query Hooks
 * React Query hooks for authentication data
 */
import { useQuery } from '@tanstack/react-query'
import { authApi, storage, setAuthToken } from '@/lib/api'
import { transformUser, transformPendingDocument } from '@/types/ui.types'
import type { User, PendingDocument } from '@/types/ui.types'

export const AUTH_QUERY_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
  compliance: ['auth', 'compliance'] as const,
}

interface ComplianceCheckResult {
  missingDocuments: PendingDocument[]
}

export function useCurrentUserQuery() {
  return useQuery<User>({
    queryKey: AUTH_QUERY_KEYS.currentUser,
    queryFn: async () => {
      const token = storage.getToken()
      if (token) {
        setAuthToken(token)
      }
      const apiUser = await authApi.getCurrentUser()
      return transformUser(apiUser)
    },
    enabled: storage.hasToken(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export function useComplianceCheckQuery() {
  return useQuery<ComplianceCheckResult>({
    queryKey: AUTH_QUERY_KEYS.compliance,
    queryFn: async () => {
      const response = await authApi.checkCompliance()
      return { 
        missingDocuments: response.pending_documents.map(transformPendingDocument) 
      }
    },
    enabled: storage.hasToken(),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}
