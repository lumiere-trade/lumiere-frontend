/**
 * Wallet Sync Hook
 *
 * Ensures wallet stays connected when user is authenticated.
 * Automatically connects the correct wallet based on user's walletType.
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
  const { connected, connecting, select, connect, wallets } = useWallet()
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

    // Find the correct wallet by name
    const userWalletType = user.walletType.toLowerCase()
    const matchingWallet = wallets.find(w => 
      w.adapter.name.toLowerCase().includes(userWalletType)
    )

    if (matchingWallet) {
      log.info('Matching wallet found, selecting and connecting', {
        userWallet: user.walletAddress.substring(0, 8) + '...',
        userWalletType: user.walletType,
        matchedWallet: matchingWallet.adapter.name,
        retryCount,
      })

      // Select the wallet first, then connect
      select(matchingWallet.adapter.name)
      
      // Small delay to let selection complete
      setTimeout(() => {
        connect().catch((error) => {
          log.error('Auto-connect failed', error)
        })
      }, 100)

      setRetryCount(0)
      return
    }

    // No matching wallet detected yet - retry with backoff
    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(INITIAL_DELAY * Math.pow(2, retryCount), MAX_DELAY)
      
      log.debug('Wallet not detected, retrying...', {
        retryCount,
        nextRetryIn: delay,
        lookingFor: user.walletType,
        availableWallets: wallets.map(w => w.adapter.name),
      })

      timeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1)
      }, delay)
    } else {
      log.warn('Max retries reached, wallet not detected', {
        maxRetries: MAX_RETRIES,
        lookingFor: user.walletType,
        availableWallets: wallets.map(w => w.adapter.name),
      })
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isAuthenticated, user, connected, connecting, wallets, select, connect, retryCount, log])

  log.debug('Wallet sync state', {
    isAuthenticated,
    hasUser: !!user,
    userWalletType: user?.walletType,
    connected,
    connecting,
    availableWallets: wallets.map(w => w.adapter.name),
    retryCount,
  })
}
