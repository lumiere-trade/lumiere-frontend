/**
 * Escrow Repository Implementation
 *
 * Adapter for Pourtier escrow API endpoints.
 */
import { Escrow } from '@/lib/domain/entities/escrow.entity'
import type {
  IEscrowRepository,
  InitializeEscrowRequest,
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
   * POST /api/escrow/initialize
   */
  async initializeEscrow(
    request: InitializeEscrowRequest
  ): Promise<InitializeEscrowResponse> {
    const response = await this.apiClient.request<{
      status: string
      data: {
        escrow_account: string
        user_id: string
        initialized_at: string
      }
    }>('/api/escrow/initialize', {
      method: 'POST',
      body: JSON.stringify({
        tx_signature: request.txSignature,
      }),
    })

    return {
      escrowAccount: response.data.escrow_account,
      userId: response.data.user_id,
      initializedAt: response.data.initialized_at,
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
        tx_signature: signedTx,
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
