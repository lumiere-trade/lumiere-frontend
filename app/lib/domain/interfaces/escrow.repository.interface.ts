/**
 * Escrow Repository Interface (Port)
 *
 * Defines contract for escrow data access.
 * Infrastructure layer will implement this interface.
 */
import { Escrow } from '../entities/escrow.entity'

export interface InitializeEscrowRequest {
  txSignature: string
}

export interface InitializeEscrowResponse {
  escrowAccount: string
  userId: string
  initializedAt: string
}

export interface PrepareDepositResponse {
  transaction: string
  escrowAccount: string
  amount: string
}

export interface DepositToEscrowRequest {
  amount: string
  txSignature: string
}

export interface DepositToEscrowResponse {
  escrowAccount: string
  amount: string
  newBalance: string
  txHash: string
}

export interface WalletBalance {
  walletAddress: string
  balance: string
  tokenMint: string
}

export interface IEscrowRepository {
  /**
   * Get user's escrow account details
   * @param sync - If true, sync with blockchain before returning
   */
  getEscrowBalance(sync?: boolean): Promise<Escrow>

  /**
   * Get wallet USDC balance (not escrow balance)
   * Queries user's wallet directly from blockchain via Pourtier API
   */
  getWalletBalance(walletAddress: string): Promise<WalletBalance>

  /**
   * Initialize escrow account (register with Pourtier after blockchain tx)
   */
  initializeEscrow(
    request: InitializeEscrowRequest
  ): Promise<InitializeEscrowResponse>

  /**
   * Prepare deposit transaction (unsigned)
   * Returns base64 transaction for wallet signing
   */
  prepareDeposit(amount: string): Promise<PrepareDepositResponse>

  /**
   * Submit deposit to escrow (register with Pourtier after signing)
   */
  submitDeposit(amount: string, signedTx: string): Promise<DepositToEscrowResponse>
}
