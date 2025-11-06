/**
 * Escrow API Functions
 */
import { get, post } from './client'
import type {
  Escrow,
  WalletBalance,
  PrepareInitializeResponse,
  InitializeEscrowResponse,
  PrepareDepositResponse,
  PrepareWithdrawResponse,
  DepositResponse,
} from './types'
import type { TransactionListResponse, TransactionType } from '@/types/api.types'

export async function getEscrowBalance(sync: boolean = false): Promise<Escrow> {
  const params = sync ? '?sync=true' : ''
  return get<Escrow>(`/api/escrow/balance${params}`)
}

export async function getWalletBalance(walletAddress: string): Promise<WalletBalance> {
  return get<WalletBalance>(`/api/wallet/balance?wallet=${walletAddress}`)
}

export async function getEscrowTransactions(
  transactionType?: TransactionType
): Promise<TransactionListResponse> {
  const params = transactionType ? `?transaction_type=${transactionType}` : ''
  return get<TransactionListResponse>(`/api/escrow/transactions${params}`)
}

export async function prepareInitializeEscrow(): Promise<PrepareInitializeResponse> {
  return post<PrepareInitializeResponse>('/api/escrow/prepare-initialize')
}

export async function submitInitializeEscrow(
  signedTx: string
): Promise<InitializeEscrowResponse> {
  return post<InitializeEscrowResponse>('/api/escrow/initialize', {
    signed_transaction: signedTx,
    token_mint: 'USDC',
  })
}

export async function prepareDeposit(amount: string): Promise<PrepareDepositResponse> {
  return post<PrepareDepositResponse>('/api/escrow/prepare-deposit', {
    amount,
  })
}

export async function submitDeposit(
  amount: string,
  signedTx: string
): Promise<DepositResponse> {
  return post<DepositResponse>('/api/escrow/deposit', {
    amount,
    signed_transaction: signedTx,
  })
}

export async function prepareWithdraw(amount: string): Promise<PrepareWithdrawResponse> {
  return post<PrepareWithdrawResponse>('/api/escrow/prepare-withdraw', {
    amount,
  })
}

export async function submitWithdraw(
  amount: string,
  signedTx: string
): Promise<DepositResponse> {
  return post<DepositResponse>('/api/escrow/withdraw', {
    amount,
    signed_transaction: signedTx,
  })
}
