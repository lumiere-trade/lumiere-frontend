/**
 * Escrow Query Hooks
 * React Query hooks for escrow data
 */
import { useQuery } from '@tanstack/react-query'
import { escrowApi, storage } from '@/lib/api'
import type { TransactionListResponse, TransactionType } from '@/types/api.types'

export const ESCROW_QUERY_KEYS = {
  balance: ['escrow', 'balance'] as const,
  walletBalance: (address: string) => ['wallet', 'balance', address] as const,
  transactions: (type?: TransactionType) => ['escrow', 'transactions', type] as const,
}

export function useEscrowBalanceQuery() {
  return useQuery({
    queryKey: ESCROW_QUERY_KEYS.balance,
    queryFn: async () => {
      return await escrowApi.getEscrowBalance()
    },
    enabled: storage.hasToken(),
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  })
}

export function useWalletBalanceQuery(walletAddress: string) {
  return useQuery<string>({
    queryKey: ESCROW_QUERY_KEYS.walletBalance(walletAddress),
    queryFn: async () => {
      const response = await escrowApi.getWalletBalance(walletAddress)
      return response.balance
    },
    enabled: storage.hasToken() && !!walletAddress,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  })
}

export function useEscrowTransactionsQuery(transactionType?: TransactionType) {
  return useQuery<TransactionListResponse>({
    queryKey: ESCROW_QUERY_KEYS.transactions(transactionType),
    queryFn: async () => {
      return await escrowApi.getEscrowTransactions(transactionType)
    },
    enabled: storage.hasToken(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false, // Prevent refetch flicker on mount
    refetchOnWindowFocus: false, // Don't refetch on focus
    retry: 2,
    placeholderData: { transactions: [] }, // Optimistic empty state
  })
}
