/**
 * Escrow Query Hooks
 *
 * React Query hooks for fetching escrow data.
 */
import { useQuery } from '@tanstack/react-query'
import { container } from '@/lib/infrastructure/di/container'
import type { Escrow } from '@/lib/domain/entities/escrow.entity'

export const ESCROW_QUERY_KEYS = {
  balance: ['escrow', 'balance'] as const,
  walletBalance: ['wallet', 'balance'] as const,
}

/**
 * Get escrow balance
 * @param sync - If true, sync with blockchain before returning
 */
export function useEscrowBalanceQuery(sync: boolean = false) {
  const escrowService = container.escrowService
  const authService = container.authService

  return useQuery<Escrow>({
    queryKey: [...ESCROW_QUERY_KEYS.balance, sync],
    queryFn: () => escrowService.getEscrowStatus(sync),
    enabled: authService.isAuthenticated(),
    staleTime: sync ? 0 : 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

/**
 * Get wallet USDC balance
 */
export function useWalletBalanceQuery() {
  const escrowService = container.escrowService
  const authService = container.authService

  return useQuery<string>({
    queryKey: ESCROW_QUERY_KEYS.walletBalance,
    queryFn: () => escrowService.getWalletBalance(),
    enabled: authService.isAuthenticated(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  })
}
