/**
 * Escrow Hook
 * Unified interface for escrow operations only
 */
import { useEscrowBalanceQuery } from './queries'
import {
  useInitializeEscrowMutation,
  useDepositToEscrowMutation,
} from './mutations'
import { useLogger } from './use-logger'
import { LogCategory } from '@/lib/debug'

export function useEscrow() {
  const log = useLogger('useEscrow', LogCategory.ESCROW)

  const {
    data: escrow,
    isLoading: isLoadingEscrow,
    error: escrowError,
    refetch: refetchEscrowBalance,
  } = useEscrowBalanceQuery(false)

  log.debug('Escrow state', {
    isInitialized: escrow?.isInitialized || false,
    escrowBalance: escrow?.balance || '0',
    isLoading: isLoadingEscrow,
  })

  const initializeEscrowMutation = useInitializeEscrowMutation()
  const depositToEscrowMutation = useDepositToEscrowMutation()

  return {
    // Escrow state
    escrow: escrow || null,
    isInitialized: escrow?.isInitialized || false,
    escrowBalance: escrow?.balance || '0',

    // Loading states
    isLoading: isLoadingEscrow,

    // Errors
    error: escrowError,

    // Refetch
    refetch: refetchEscrowBalance,

    // Actions
    initializeEscrow: () => initializeEscrowMutation.mutateAsync(),
    depositToEscrow: (amount: string) => depositToEscrowMutation.mutateAsync(amount),

    // Action states
    isInitializing: initializeEscrowMutation.isPending,
    isDepositing: depositToEscrowMutation.isPending,

    // Action errors
    initializeError: initializeEscrowMutation.error,
    depositError: depositToEscrowMutation.error,
  }
}
