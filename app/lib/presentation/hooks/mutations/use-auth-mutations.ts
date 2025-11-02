/**
 * Auth Mutation Hooks.
 * React Query mutations for auth-related operations.
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { container } from '@/lib/infrastructure/di/container';
import { invalidateAuthDependentQueries } from '@/lib/infrastructure/cache/auth-cache-manager';
import { User } from '@/lib/domain/entities/user.entity';
import { PendingDocument } from '@/lib/domain/entities/pending-document.entity';
import { AUTH_QUERY_KEYS } from '../queries/use-auth-queries';
import { ROUTES } from '@/config/constants';

interface LoginResult {
  user: User;
  pendingDocuments: PendingDocument[];
}

interface CreateAccountParams {
  acceptedDocumentIds: string[];
}

interface CreateAccountResult {
  user: User;
}

interface AcceptDocumentsParams {
  documentIds: string[];
}

export function useLoginMutation(
  options?: UseMutationOptions<LoginResult, Error, void>
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const authService = container.authService;

  return useMutation<LoginResult, Error, void>({
    mutationFn: async () => {
      const result = await authService.verifyAndLogin();
      return {
        user: result.user!,
        pendingDocuments: result.pendingDocuments,
      };
    },
    onSuccess: (data) => {
      // Update user in cache optimistically
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, data.user);
      
      // Invalidate all auth-dependent queries (centralized)
      invalidateAuthDependentQueries(queryClient);

      if (data.pendingDocuments.length > 0) {
        router.push('/onboarding');
      } else {
        router.push(ROUTES.DASHBOARD);
      }
    },
    ...options,
  });
}

export function useCreateAccountMutation(
  options?: UseMutationOptions<CreateAccountResult, Error, CreateAccountParams>
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const authService = container.authService;

  return useMutation<CreateAccountResult, Error, CreateAccountParams>({
    mutationFn: async ({ acceptedDocumentIds }) => {
      const result = await authService.createAccount(acceptedDocumentIds);
      return {
        user: result.user!,
      };
    },
    onSuccess: (data) => {
      // Update user in cache optimistically
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, data.user);
      
      // Invalidate all auth-dependent queries (centralized)
      invalidateAuthDependentQueries(queryClient);
      
      router.push(ROUTES.DASHBOARD);
    },
    ...options,
  });
}

export function useLogoutMutation(
  options?: UseMutationOptions<void, Error, void>
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const authService = container.authService;

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      authService.logout();
    },
    onSuccess: () => {
      // Clear all cached queries on logout
      queryClient.clear();
      router.push(ROUTES.HOME);
    },
    ...options,
  });
}

export function useAcceptDocumentsMutation(
  options?: UseMutationOptions<void, Error, AcceptDocumentsParams>
) {
  const queryClient = useQueryClient();
  const authService = container.authService;

  return useMutation<void, Error, AcceptDocumentsParams>({
    mutationFn: async ({ documentIds }) => {
      await authService.acceptPendingDocuments(documentIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.currentUser });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.compliance });
    },
    ...options,
  });
}
