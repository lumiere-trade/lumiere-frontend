/**
 * Passeur Repository Implementation
 * 
 * Adapter for Passeur bridge service (blockchain operations).
 */

import type {
  IPasseurRepository,
  WalletBalance,
  InitializeEscrowTransaction,
  DepositTransaction,
} from '@/lib/domain/interfaces/passeur.repository.interface'

export class PasseurRepository implements IPasseurRepository {
  private readonly passeurUrl: string

  constructor(passeurUrl?: string) {
    this.passeurUrl = passeurUrl || process.env.NEXT_PUBLIC_PASSEUR_URL || 'http://localhost:8767'
  }

  /**
   * GET /wallet/balance?wallet={address}
   */
  async getWalletBalance(walletAddress: string): Promise<WalletBalance> {
    const response = await fetch(
      `${this.passeurUrl}/wallet/balance?wallet=${walletAddress}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get wallet balance: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      walletAddress: data.wallet || walletAddress,
      balance: data.balance || '0',
      tokenMint: data.token_mint || 'USDC',
    }
  }

  /**
   * POST /escrow/prepare-initialize
   */
  async prepareInitializeEscrow(
    userAddress: string
  ): Promise<InitializeEscrowTransaction> {
    const response = await fetch(
      `${this.passeurUrl}/escrow/prepare-initialize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_address: userAddress,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to prepare initialize: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      escrowAccount: data.escrow_account,
      signature: data.signature,
      transaction: data.transaction,
    }
  }

  /**
   * POST /escrow/prepare-deposit
   */
  async prepareDeposit(
    escrowAccount: string,
    amount: string
  ): Promise<DepositTransaction> {
    const response = await fetch(
      `${this.passeurUrl}/escrow/prepare-deposit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrow_account: escrowAccount,
          amount,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to prepare deposit: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      signature: data.signature,
      transaction: data.transaction,
    }
  }
}
