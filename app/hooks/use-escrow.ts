/**
 * Unified Escrow Hook
 * 
 * Convenient hook that combines queries and mutations for escrow operations.
 */

import { useEscrowBalanceQuery, useWalletBalanceQuery } from '@/lib/presentation/hooks/queries/use-escrow-queries'
import { useInitializeEscrowMutation, useDepositToEscrowMutation } from '@/lib/presentation/hooks/mutations/use-escrow-mutations'

export function useEscrow() {
  const { data: escrow, isLoading: isLoadingEscrow, error: escrowError } = useEscrowBalanceQuery(false)
  const { data: walletBalance, isLoading: isLoadingWallet, error: walletError } = useWalletBalanceQuery()
  
  const initializeEscrowMutation = useInitializeEscrowMutation()
  const depositToEscrowMutation = useDepositToEscrowMutation()
  
  return {
    // State
    escrow: escrow || null,
    walletBalance: walletBalance || '0',
    isInitialized: escrow?.isInitialized || false,
    escrowBalance: escrow?.balance || '0',
    
    // Loading states
    isLoading: isLoadingEscrow || isLoadingWallet,
    isLoadingEscrow,
    isLoadingWallet,
    
    // Errors
    error: escrowError || walletError,
    escrowError,
    walletError,
    
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
