/**
 * Passeur Repository Interface (Port)
 * 
 * Defines contract for blockchain operations via Passeur bridge.
 * Infrastructure layer will implement this interface.
 */

export interface WalletBalance {
  walletAddress: string
  balance: string
  tokenMint: string
}

export interface InitializeEscrowTransaction {
  escrowAccount: string
  signature: string
  transaction: string
}

export interface DepositTransaction {
  signature: string
  transaction: string
}

export interface IPasseurRepository {
  /**
   * Get wallet USDC balance from blockchain
   */
  getWalletBalance(walletAddress: string): Promise<WalletBalance>
  
  /**
   * Prepare initialize escrow transaction
   * Returns unsigned transaction for user to sign
   */
  prepareInitializeEscrow(userAddress: string): Promise<InitializeEscrowTransaction>
  
  /**
   * Prepare deposit transaction
   * Returns unsigned transaction for user to sign
   */
  prepareDeposit(
    escrowAccount: string,
    amount: string
  ): Promise<DepositTransaction>
}
