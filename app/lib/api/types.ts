/**
 * API Response Types
 * Simple interfaces matching backend responses
 */

export interface User {
  id: string
  wallet_address: string
  wallet_type: string
  created_at: string
}

export interface PendingDocument {
  id: string
  document_type: string
  version: string
  title: string
}

export interface LegalDocument {
  id: string
  document_type: string
  version: string
  title: string
  content: string
  status: string
  effective_date: string
  created_at: string
  updated_at: string
}

export interface Escrow {
  escrow_account: string | null
  balance: string
  token_mint: string
  is_initialized: boolean
  initialized_at: string | null
  last_synced_at: string | null
}

export interface WalletBalance {
  wallet_address: string
  balance: string
  token_mint: string
}

export interface VerifyWalletResponse {
  signature_valid: boolean
  user_exists: boolean
}

export interface LoginResponse {
  user_id: string
  wallet_address: string
  access_token: string
  pending_documents: PendingDocument[]
}

export interface CreateAccountResponse {
  user_id: string
  wallet_address: string
  access_token: string
}

export interface CheckComplianceResponse {
  pending_documents: PendingDocument[]
}

export interface PrepareInitializeResponse {
  transaction: string
  token_mint: string
}

export interface InitializeEscrowResponse {
  escrow_account: string
  balance: string
  token_mint: string
  tx_signature: string
}

export interface PrepareDepositResponse {
  transaction: string
  escrow_account: string
  amount: string
}

export interface PrepareWithdrawResponse {
  transaction: string
  escrow_account: string
  amount: string
}

export interface DepositResponse {
  id: string
  user_id: string
  tx_signature: string
  transaction_type: string
  amount: string
  token_mint: string
  status: string
  created_at: string
  confirmed_at: string | null
}

// ============================================================================
// STRATEGY TYPES
// ============================================================================

export type StrategyStatus =
  | 'INACTIVE'     // Not deployed yet
  | 'ACTIVE'       // Running live
  | 'PAUSED'       // Temporarily stopped
  | 'STOPPED'      // Permanently stopped
  | 'UNDEPLOYED'   // Removed from system
  | 'ERROR'        // Failed state

export interface Strategy {
  id: string
  user_id: string
  name: string
  description: string
  tsdl_code: string
  version: string
  base_plugins: string[]
  parameters: Record<string, any>
  created_at: string
  updated_at: string
  deployment_status?: StrategyStatus
}

export interface StrategyStatusResponse {
  strategy_id: string
  status: StrategyStatus
  user_id: string
  token_symbol: string
  current_capital: number
  is_paper_trading: boolean
  created_at: string
}
