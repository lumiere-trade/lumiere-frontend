/**
 * Escrow Query Hooks
 * React Query hooks for escrow transactions
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { escrowApi, TransactionListResponse, TransactionType } from '@/lib/api/escrow';
import { storage } from '@/lib/api/storage';
import { setAuthToken } from '@/lib/api/client';

export const ESCROW_QUERY_KEYS = {
  balance: ['escrow', 'balance'] as const,
  walletBalance: (address: string) => ['wallet', 'balance', address] as const,
  transactions: (type?: TransactionType) =>
    type ? ['escrow', 'transactions', type] : ['escrow', 'transactions'] as const,
};

export function useEscrowBalanceQuery() {
  return useQuery({
    queryKey: ESCROW_QUERY_KEYS.balance,
    queryFn: async () => {
      const token = storage.getToken()
      if (token) {
        setAuthToken(token)
      }
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
      const token = storage.getToken()
      if (token) {
        setAuthToken(token)
      }
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
      const token = storage.getToken()
      if (token) {
        setAuthToken(token)
      }
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
