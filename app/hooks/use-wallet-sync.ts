/**
 * Wallet Sync Hook
 * 
 * Ensures wallet stays connected when user is authenticated.
 * Automatically connects wallet if user has valid JWT but wallet is disconnected.
 */
import { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from './use-auth'
import { useLogger } from './use-logger'
import { LogCategory } from '@/lib/debug'

export function useWalletSync() {
  const log = useLogger('useWalletSync', LogCategory.WALLET)
  const { user, isAuthenticated } = useAuth()
  const { connected, connecting, connect, wallet } = useWallet()

  useEffect(() => {
    // Only sync if user is authenticated but wallet not connected
    if (isAuthenticated && user && !connected && !connecting && wallet) {
      log.info('User authenticated but wallet disconnected, auto-connecting', {
        userWallet: user.walletAddress.substring(0, 8) + '...',
        walletName: wallet.adapter.name,
      })

      connect().catch((error) => {
        log.error('Auto-connect failed', error)
      })
    }
  }, [isAuthenticated, user, connected, connecting, wallet, connect, log])

  log.debug('Wallet sync state', {
    isAuthenticated,
    hasUser: !!user,
    connected,
    connecting,
    hasWallet: !!wallet,
  })
}
