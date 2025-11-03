/**
 * Auth Hook
 * Unified interface for authentication using React Query
 */
import {
  useCurrentUserQuery,
  useComplianceCheckQuery,
} from './queries'
import {
  useLoginMutation,
  useCreateAccountMutation,
  useLogoutMutation,
  useAcceptDocumentsMutation,
} from './mutations'

export function useAuth() {
  const { data: user, isLoading: isLoadingUser, error: userError } = useCurrentUserQuery()
  const {
    data: complianceData,
    isLoading: isLoadingCompliance
  } = useComplianceCheckQuery()

  const loginMutation = useLoginMutation()
  const createAccountMutation = useCreateAccountMutation()
  const logoutMutation = useLogoutMutation()
  const acceptDocsMutation = useAcceptDocumentsMutation()

  return {
    // State
    user: user ?? null,
    isAuthenticated: user !== undefined && user !== null,
    isLoading: isLoadingUser || isLoadingCompliance,
    pendingDocuments: complianceData?.missingDocuments ?? [],
    error: userError?.message ?? null,

    // Actions
    login: () => loginMutation.mutateAsync(),
    createAccount: (acceptedDocumentIds: string[]) =>
      createAccountMutation.mutateAsync({ acceptedDocumentIds }),
    logout: () => logoutMutation.mutateAsync(),
    acceptPendingDocuments: (documentIds: string[]) =>
      acceptDocsMutation.mutateAsync({ documentIds }),

    // Action loading states
    isLoggingIn: loginMutation.isPending,
    isCreatingAccount: createAccountMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isAcceptingDocuments: acceptDocsMutation.isPending,
  }
}
