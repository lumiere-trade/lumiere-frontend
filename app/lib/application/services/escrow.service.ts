/**
 * Escrow Service
 *
 * Orchestrates escrow operations between domain logic and infrastructure.
 */

import { Escrow } from '@/lib/domain/entities/escrow.entity'
import {
  EscrowNotInitializedError,
  InvalidDepositAmountError,
} from '@/lib/domain/errors/escrow.errors'
import type { IEscrowRepository } from '@/lib/domain/interfaces/escrow.repository.interface'
import type { IWalletProvider } from '@/lib/domain/interfaces/wallet.provider.interface'

export interface InitializeEscrowResult {
  escrow: Escrow
  txSignature: string
}

export interface DepositResult {
  escrow: Escrow
  txSignature: string
  amount: string
}

export class EscrowService {
  constructor(
    private readonly escrowRepository: IEscrowRepository,
    private readonly walletProvider: IWalletProvider
  ) {}

  /**
   * Get current escrow status
   */
  async getEscrowStatus(sync: boolean = false): Promise<Escrow> {
    return await this.escrowRepository.getEscrowBalance(sync)
  }

  /**
   * Get wallet USDC balance
   */
  async getWalletBalance(): Promise<string> {
    const walletAddress = this.walletProvider.getAddress()

    if (!walletAddress) {
      throw new Error('Wallet not connected')
    }

    const balance = await this.escrowRepository.getWalletBalance(walletAddress)
    return balance.balance
  }

  /**
   * Initialize escrow account
   *
   * Flow:
   * 1. Check if already initialized
   * 2. Prepare blockchain transaction via Passeur
   * 3. User signs transaction in wallet
   * 4. Register with Pourtier
   */
  async initializeEscrow(): Promise<InitializeEscrowResult> {
    const walletAddress = this.walletProvider.getAddress()

    if (!walletAddress) {
      throw new Error('Wallet not connected')
    }

    // Check if already initialized
    const currentEscrow = await this.escrowRepository.getEscrowBalance(false)
    if (currentEscrow.isInitialized) {
      return {
        escrow: currentEscrow,
        txSignature: '', // Already initialized
      }
    }

    // TODO: Implement initialize escrow flow
    // This requires blockchain transaction preparation
    throw new Error('Initialize escrow not yet implemented')
  }

  /**
   * Deposit funds to escrow
   *
   * Flow:
   * 1. Validate amount
   * 2. Check escrow initialized
   * 3. Prepare blockchain transaction
   * 4. User signs transaction
   * 5. Register with Pourtier
   */
  async depositToEscrow(amount: string): Promise<DepositResult> {
    // Validate amount
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new InvalidDepositAmountError('Amount must be greater than 0')
    }

    // Check wallet balance
    const walletBalance = await this.getWalletBalance()
    if (parseFloat(walletBalance) < amountNum) {
      throw new InvalidDepositAmountError(
        `Insufficient wallet balance. Available: ${walletBalance} USDC`
      )
    }

    // Get escrow status
    let escrow = await this.escrowRepository.getEscrowBalance(false)

    // Initialize escrow if needed
    if (!escrow.isInitialized) {
      const initResult = await this.initializeEscrow()
      escrow = initResult.escrow
    }

    if (!escrow.escrowAccount) {
      throw new EscrowNotInitializedError()
    }

    // TODO: Implement deposit flow
    // This requires blockchain transaction preparation
    throw new Error('Deposit not yet implemented')
  }
}
