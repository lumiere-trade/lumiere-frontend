/**
 * Auth Hook (React Query version).
 * Unified interface for authentication using React Query.
 */

import {
  useCurrentUserQuery,
  useComplianceCheckQuery,
} from '@/lib/presentation/hooks/queries';

import {
  useLoginMutation,
  useCreateAccountMutation,
  useLogoutMutation,
  useAcceptDocumentsMutation,
} from '@/lib/presentation/hooks/mutations';

export function useAuth() {
  const { data: user, isLoading: isLoadingUser, error: userError } = useCurrentUserQuery();
  
  const { 
    data: complianceData, 
    isLoading: isLoadingCompliance 
  } = useComplianceCheckQuery();

  const loginMutation = useLoginMutation();
  const createAccountMutation = useCreateAccountMutation();
  const logoutMutation = useLogoutMutation();
  const acceptDocsMutation = useAcceptDocumentsMutation();

  return {
    // State
    user: user ?? null,
    isAuthenticated: user !== undefined && user !== null,
    isLoading: isLoadingUser || isLoadingCompliance,
    pendingDocuments: complianceData?.missingDocuments ?? [],
    error: userError?.message ?? null,

    // Actions (return promises for better error handling)
    login: () => loginMutation.mutateAsync(),
    createAccount: (acceptedDocumentIds: string[]) => 
      createAccountMutation.mutateAsync({ acceptedDocumentIds }),
    logout: () => logoutMutation.mutateAsync(),
    acceptPendingDocuments: (documentIds: string[]) => 
      acceptDocsMutation.mutateAsync({ documentIds }),

    // Additional state for granular loading indicators
    isLoggingIn: loginMutation.isPending,
    isCreatingAccount: createAccountMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isAcceptingDocuments: acceptDocsMutation.isPending,

    // Legacy properties removed - components must be updated
    checkCompliance: undefined as never, // Force components to use queries directly
    loadLegalDocuments: undefined as never, // Force components to use queries directly
    refreshUser: undefined as never, // React Query handles this automatically
    clearError: undefined as never, // Not needed with React Query error handling
    legalDocuments: [] as never, // Should come from separate query
  };
}
