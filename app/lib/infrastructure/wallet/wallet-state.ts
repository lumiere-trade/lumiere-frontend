/**
 * Wallet State Manager (Infrastructure Singleton).
 *
 * Bridges React context state with Clean Architecture layers.
 * Allows Infrastructure layer to access wallet state without
 * violating dependency rules.
 */

import type { PublicKey } from '@solana/web3.js'
import type { SolanaWalletAdapter } from './solana-wallet-provider'

interface WalletState {
  adapter: SolanaWalletAdapter | null
  publicKey: PublicKey | null
  connected: boolean
}

class WalletStateManager {
  private state: WalletState = {
    adapter: null,
    publicKey: null,
    connected: false,
  }

  /**
   * Update wallet state (called by React context).
   */
  updateState(
    adapter: SolanaWalletAdapter | null,
    publicKey: PublicKey | null,
    connected: boolean
  ): void {
    this.state = {
      adapter,
      publicKey,
      connected,
    }
  }

  /**
   * Get current wallet state (called by adapter).
   */
  getState(): WalletState {
    return this.state
  }

  /**
   * Clear wallet state (called on disconnect).
   */
  clearState(): void {
    this.state = {
      adapter: null,
      publicKey: null,
      connected: false,
    }
  }
}

export const walletStateManager = new WalletStateManager()
