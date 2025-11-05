/**
 * Wallet Sync Hook
 *
 * Ensures wallet stays connected when user is authenticated.
 * Automatically connects wallet if user has valid JWT but wallet disconnected.
 * Retries wallet detection with exponential backoff.
 */
import { useEffect, useState, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from './use-auth'
import { useLogger } from './use-logger'
import { LogCategory } from '@/lib/debug'

const MAX_RETRIES = 10
const INITIAL_DELAY = 100 // ms
const MAX_DELAY = 5000 // ms

export function useWalletSync() {
  const log = useLogger('useWalletSync', LogCategory.WALLET)
  const { user, isAuthenticated } = useAuth()
  const { connected, connecting, connect, wallet, wallets } = useWallet()
  const [retryCount, setRetryCount] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // User must be authenticated
    if (!isAuthenticated || !user) {
      setRetryCount(0)
      return
    }

    // Already connected - success!
    if (connected) {
      log.info('Wallet already connected')
      setRetryCount(0)
      return
    }

    // Currently connecting - wait
    if (connecting) {
      log.debug('Wallet connecting...')
      return
    }

    // Wallet detected - connect now
    if (wallet) {
      log.info('Wallet detected, auto-connecting', {
        userWallet: user.walletAddress.substring(0, 8) + '...',
        walletName: wallet.adapter.name,
        retryCount,
      })

      connect().catch((error) => {
        log.error('Auto-connect failed', error)
      })

      setRetryCount(0)
      return
    }

    // No wallet detected yet - retry with backoff
    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(INITIAL_DELAY * Math.pow(2, retryCount), MAX_DELAY)
      
      log.debug('Wallet not detected, retrying...', {
        retryCount,
        nextRetryIn: delay,
        availableWallets: wallets.length,
      })

      timeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1)
      }, delay)
    } else {
      log.warn('Max retries reached, wallet not detected', {
        maxRetries: MAX_RETRIES,
        availableWallets: wallets.length,
      })
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isAuthenticated, user, connected, connecting, wallet, wallets, connect, retryCount, log])

  log.debug('Wallet sync state', {
    isAuthenticated,
    hasUser: !!user,
    connected,
    connecting,
    hasWallet: !!wallet,
    availableWallets: wallets.length,
    retryCount,
  })
}
