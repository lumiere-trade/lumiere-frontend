/**
 * Solana Wallet Provider Implementation (Adapter).
 * Wraps Solana wallet adapter with our IWalletProvider interface.
 *
 * REACTIVE DESIGN: Uses factory function to get fresh wallet state
 * on every call, eliminating race conditions.
 */

import type {
  IWalletProvider,
  SignatureResult,
} from '@/lib/domain/interfaces/wallet.provider.interface'
import {
  WalletNotConnectedError,
  WalletSignatureError,
  WalletConnectionError,
} from '@/lib/domain/errors/wallet.errors'
import bs58 from 'bs58'

export interface SolanaWalletAdapter {
  publicKey: { toString(): string } | null
  signMessage(message: Uint8Array): Promise<Uint8Array>
  signTransaction?(transaction: any): Promise<any>
  connected: boolean
  connect(): Promise<void>
  disconnect(): Promise<void>
  name?: string
}

interface WalletState {
  adapter: SolanaWalletAdapter | null
  publicKey: { toString(): string } | null
  connected: boolean
}

export class SolanaWalletProvider implements IWalletProvider {
  constructor(private getWalletState: () => WalletState) {}

  async connect(): Promise<string> {
    const state = this.getWalletState()
    
    if (!state.adapter) {
      throw new WalletConnectionError('No wallet adapter available')
    }

    try {
      await state.adapter.connect()
      
      const freshState = this.getWalletState()
      if (!freshState.publicKey) {
        throw new WalletConnectionError('Failed to get public key')
      }
      
      return freshState.publicKey.toString()
    } catch (error) {
      throw new WalletConnectionError(
        error instanceof Error ? error.message : 'Connection failed'
      )
    }
  }

  async disconnect(): Promise<void> {
    const state = this.getWalletState()
    if (!state.adapter) return

    try {
      await state.adapter.disconnect()
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  async signMessage(message: string): Promise<SignatureResult> {
    const state = this.getWalletState()
    
    if (!state.adapter || !state.connected || !state.publicKey) {
      throw new WalletNotConnectedError()
    }

    try {
      const messageBytes = new TextEncoder().encode(message)
      const signatureBytes = await state.adapter.signMessage(messageBytes)
      const signature = bs58.encode(signatureBytes)
      const address = state.publicKey.toString()

      return { address, signature }
    } catch (error) {
      throw new WalletSignatureError(
        error instanceof Error ? error.message : 'Signature failed'
      )
    }
  }

  async signTransaction(transaction: any): Promise<any> {
    const state = this.getWalletState()
    
    if (!state.adapter || !state.connected || !state.publicKey) {
      throw new WalletNotConnectedError()
    }

    if (!state.adapter.signTransaction) {
      throw new WalletSignatureError('Wallet does not support transaction signing')
    }

    try {
      return await state.adapter.signTransaction(transaction)
    } catch (error) {
      throw new WalletSignatureError(
        error instanceof Error ? error.message : 'Transaction signature failed'
      )
    }
  }

  isConnected(): boolean {
    const state = this.getWalletState()
    return state.connected ?? false
  }

  getAddress(): string | null {
    const state = this.getWalletState()
    return state.publicKey?.toString() ?? null
  }

  getWalletType(): string {
    const state = this.getWalletState()
    return state.adapter?.name ?? 'Unknown'
  }
}
