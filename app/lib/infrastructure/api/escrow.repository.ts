/**
 * Escrow Repository Implementation
 *
 * Adapter for Pourtier escrow API endpoints.
 */
import { Escrow } from '@/lib/domain/entities/escrow.entity'
import type {
  IEscrowRepository,
  PrepareInitializeEscrowResponse,
  InitializeEscrowResponse,
  PrepareDepositResponse,
  DepositToEscrowResponse,
  WalletBalance,
} from '@/lib/domain/interfaces/escrow.repository.interface'
import { BaseAPIClient } from './base-api.client'

export class EscrowRepository implements IEscrowRepository {
  constructor(private readonly apiClient: BaseAPIClient) {}

  /**
   * GET /api/escrow/balance
   */
  async getEscrowBalance(sync: boolean = false): Promise<Escrow> {
    const params = sync ? '?sync=true' : ''
    const response = await this.apiClient.request<{
      escrow_account: string | null
      balance: string
      token_mint: string
      is_initialized: boolean
      initialized_at: string | null
      last_synced_at: string | null
    }>(`/api/escrow/balance${params}`, {
      method: 'GET',
    })

    return Escrow.fromApi(response)
  }

  /**
   * GET /api/wallet/balance?wallet={address}
   */
  async getWalletBalance(walletAddress: string): Promise<WalletBalance> {
    const response = await this.apiClient.request<{
      wallet_address: string
      balance: string
      token_mint: string
    }>(`/api/wallet/balance?wallet=${walletAddress}`, {
      method: 'GET',
    })

    return {
      walletAddress: response.wallet_address,
      balance: response.balance,
      tokenMint: response.token_mint,
    }
  }

  /**
   * POST /api/escrow/prepare-initialize
   * Get unsigned initialize transaction for wallet signing
   */
  async prepareInitializeEscrow(): Promise<PrepareInitializeEscrowResponse> {
    const response = await this.apiClient.request<{
      transaction: string
      token_mint: string
    }>('/api/escrow/prepare-initialize', {
      method: 'POST',
    })

    return {
      transaction: response.transaction,
      tokenMint: response.token_mint,
    }
  }

  /**
   * POST /api/escrow/initialize
   * Submit signed initialize transaction
   */
  async submitInitializeEscrow(
    signedTx: string
  ): Promise<InitializeEscrowResponse> {
    const response = await this.apiClient.request<{
      escrow_account: string
      balance: string
      token_mint: string
      tx_signature: string
    }>('/api/escrow/initialize', {
      method: 'POST',
      body: JSON.stringify({
        signed_transaction: signedTx,
        token_mint: 'USDC',
      }),
    })

    return {
      escrowAccount: response.escrow_account,
      userId: '',
      initializedAt: new Date().toISOString(),
    }
  }

  /**
   * POST /api/escrow/prepare-deposit
   * Get unsigned transaction for wallet signing
   */
  async prepareDeposit(amount: string): Promise<PrepareDepositResponse> {
    const response = await this.apiClient.request<{
      transaction: string
      escrow_account: string
      amount: string
    }>('/api/escrow/prepare-deposit', {
      method: 'POST',
      body: JSON.stringify({
        amount: amount,
      }),
    })

    return {
      transaction: response.transaction,
      escrowAccount: response.escrow_account,
      amount: response.amount,
    }
  }

  /**
   * POST /api/escrow/deposit
   * Submit signed transaction
   */
  async submitDeposit(
    amount: string,
    signedTx: string
  ): Promise<DepositToEscrowResponse> {
    const response = await this.apiClient.request<{
      id: string
      user_id: string
      tx_signature: string
      transaction_type: string
      amount: string
      token_mint: string
      status: string
      created_at: string
      confirmed_at: string | null
    }>('/api/escrow/deposit', {
      method: 'POST',
      body: JSON.stringify({
        amount: amount,
        signed_transaction: signedTx,
      }),
    })

    return {
      escrowAccount: '',
      amount: response.amount,
      newBalance: '0',
      txHash: response.tx_signature,
    }
  }
}
