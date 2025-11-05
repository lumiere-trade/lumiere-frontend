'use client'

/**
 * Wallet Sync Component
 * 
 * Ensures wallet connection is synchronized with authentication state.
 * Automatically connects wallet when user is authenticated but wallet disconnected.
 */
import { useWalletSync } from '@/hooks/use-wallet-sync'

interface WalletSyncProps {
  children: React.ReactNode
}

export function WalletSync({ children }: WalletSyncProps) {
  useWalletSync()
  return <>{children}</>
}
