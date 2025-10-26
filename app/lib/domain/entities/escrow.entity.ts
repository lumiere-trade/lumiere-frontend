/**
 * Escrow Entity
 * 
 * Represents user's escrow account on Solana blockchain.
 * Escrow is a PDA (Program Derived Address) managed by Passeur smart contract.
 */

export interface EscrowProps {
  escrowAccount: string | null
  balance: string
  tokenMint: string
  isInitialized: boolean
  initializedAt: Date | null
  lastSyncedAt: Date | null
}

export class Escrow {
  private constructor(private readonly props: EscrowProps) {
    this.validate()
  }

  private validate(): void {
    if (this.props.isInitialized && !this.props.escrowAccount) {
      throw new Error('Initialized escrow must have account address')
    }

    if (this.props.escrowAccount && !this.isValidSolanaAddress(this.props.escrowAccount)) {
      throw new Error('Invalid escrow account address')
    }

    const balance = parseFloat(this.props.balance)
    if (isNaN(balance) || balance < 0) {
      throw new Error('Invalid escrow balance')
    }
  }

  private isValidSolanaAddress(address: string): boolean {
    // Solana addresses are base58 encoded, 32-44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
  }

  // Getters
  get escrowAccount(): string | null {
    return this.props.escrowAccount
  }

  get balance(): string {
    return this.props.balance
  }

  get tokenMint(): string {
    return this.props.tokenMint
  }

  get isInitialized(): boolean {
    return this.props.isInitialized
  }

  get initializedAt(): Date | null {
    return this.props.initializedAt
  }

  get lastSyncedAt(): Date | null {
    return this.props.lastSyncedAt
  }

  // Business logic
  get balanceAsNumber(): number {
    return parseFloat(this.props.balance)
  }

  canDeposit(amount: number): boolean {
    return amount > 0
  }

  canWithdraw(amount: number): boolean {
    return amount > 0 && amount <= this.balanceAsNumber
  }

  // Factory methods
  static create(props: EscrowProps): Escrow {
    return new Escrow(props)
  }

  static createUninitialized(): Escrow {
    return new Escrow({
      escrowAccount: null,
      balance: '0',
      tokenMint: 'USDC',
      isInitialized: false,
      initializedAt: null,
      lastSyncedAt: null,
    })
  }

  static fromApi(data: any): Escrow {
    return new Escrow({
      escrowAccount: data.escrow_account || null,
      balance: data.balance || '0',
      tokenMint: data.token_mint || 'USDC',
      isInitialized: data.is_initialized || false,
      initializedAt: data.initialized_at ? new Date(data.initialized_at) : null,
      lastSyncedAt: data.last_synced_at ? new Date(data.last_synced_at) : null,
    })
  }

  toJson() {
    return {
      escrowAccount: this.props.escrowAccount,
      balance: this.props.balance,
      tokenMint: this.props.tokenMint,
      isInitialized: this.props.isInitialized,
      initializedAt: this.props.initializedAt?.toISOString() || null,
      lastSyncedAt: this.props.lastSyncedAt?.toISOString() || null,
    }
  }
}
