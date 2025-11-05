/**
 * Wallet Balance Hook
 * 
 * Manages wallet USDC balance queries.
 * Uses authenticated user's wallet address from JWT token.
 */
import { useAuth } from './use-auth'
import { useWalletBalanceQuery } from './queries'
import { useLogger } from './use-logger'
import { LogCategory } from '@/lib/debug'

export function useWalletBalance() {
  const log = useLogger('useWalletBalance', LogCategory.WALLET)
  const { user } = useAuth()
  const walletAddress = user?.walletAddress || ''

  log.debug('Wallet balance hook state', {
    hasUser: !!user,
    walletAddress: walletAddress ? walletAddress.substring(0, 8) + '...' : 'none',
  })

  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useWalletBalanceQuery(walletAddress)

  log.debug('Wallet balance query result', {
    balance,
    isLoading,
    hasError: !!error,
  })

  return {
    balance: balance || '0',
    isLoading,
    error,
    refetch,
  }
}
