/**
 * Escrow Hook
 * Unified interface for escrow operations
 */
import { useWallet } from '@solana/wallet-adapter-react'
import {
  useEscrowBalanceQuery,
  useWalletBalanceQuery,
} from './queries'
import {
  useInitializeEscrowMutation,
  useDepositToEscrowMutation,
} from './mutations'

export function useEscrow() {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58() || ''

  const { 
    data: escrow, 
    isLoading: isLoadingEscrow, 
    error: escrowError 
  } = useEscrowBalanceQuery(false)

  const { 
    data: walletBalance, 
    isLoading: isLoadingWallet, 
    error: walletError 
  } = useWalletBalanceQuery(walletAddress)

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
