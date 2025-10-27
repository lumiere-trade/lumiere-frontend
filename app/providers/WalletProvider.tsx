'use client'

/**
 * Wallet Provider.
 * Bridges Solana Wallet Adapter with our Clean Architecture.
 *
 * CRITICAL: This provider syncs the Solana wallet adapter state
 * with walletStateManager to ensure all services have access
 * to the connected wallet via reactive getters.
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { walletStateManager } from '@/lib/infrastructure/wallet/wallet-state'

interface WalletContextType {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  clearError: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: React.ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const solanaWallet = useSolanaWallet()
  const [error, setError] = useState<string | null>(null)

  // CRITICAL: Sync Solana wallet adapter with wallet state manager
  // This ensures all services can access the connected wallet
  useEffect(() => {
    walletStateManager.updateState(
      solanaWallet.wallet?.adapter as any ?? null,
      solanaWallet.publicKey ?? null,
      solanaWallet.connected
    )
  }, [
    solanaWallet.wallet?.adapter,
    solanaWallet.publicKey,
    solanaWallet.connected,
  ])

  const connect = useCallback(async () => {
    setError(null)
    try {
      // Connection is handled by WalletConnectionModal
      // which uses solanaWallet.select() and solanaWallet.connect()
      // This function is kept for API compatibility
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet'
      setError(errorMessage)
      throw err
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      await solanaWallet.disconnect()
      walletStateManager.clearState()
      setError(null)
    } catch (err) {
      console.error('Disconnect error:', err)
    }
  }, [solanaWallet])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <WalletContext.Provider
      value={{
        address: solanaWallet.publicKey?.toString() ?? null,
        isConnected: solanaWallet.connected,
        isConnecting: solanaWallet.connecting,
        error,
        connect,
        disconnect,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
