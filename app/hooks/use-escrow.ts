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
import { useLogger } from './use-logger'
import { LogCategory } from '@/lib/debug'

export function useEscrow() {
  const log = useLogger('useEscrow', LogCategory.ESCROW)
  const { publicKey, connected } = useWallet()
  const walletAddress = publicKey?.toBase58() || ''

  log.debug('Hook state', {
    connected,
    walletAddress,
    hasPublicKey: !!publicKey,
  })

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

  log.debug('Wallet balance query', {
    walletBalance,
    isLoadingWallet,
    hasError: !!walletError,
  })

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
