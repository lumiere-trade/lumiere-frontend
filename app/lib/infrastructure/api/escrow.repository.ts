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
  DepositToEscrowRequest,
  DepositToEscrowResponse,
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
   * POST /api/escrow/deposit
   */
  async depositToEscrow(
    request: DepositToEscrowRequest
  ): Promise<DepositToEscrowResponse> {
    const response = await this.apiClient.request<{
      status: string
      data: {
        escrow_account: string
        amount: string
        new_balance: string
        tx_hash: string
      }
    }>('/api/escrow/deposit', {
      method: 'POST',
      body: JSON.stringify({
        amount: request.amount,
        tx_signature: request.txSignature,
      }),
    })

    return {
      escrowAccount: response.data.escrow_account,
      amount: response.data.amount,
      newBalance: response.data.new_balance,
      txHash: response.data.tx_hash,
    }
  }
}
