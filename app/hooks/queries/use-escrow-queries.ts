/**
 * Escrow Query Hooks
 * React Query hooks for escrow data
 */
import { useQuery } from '@tanstack/react-query'
import { escrowApi, storage, setAuthToken } from '@/lib/api'
import { transformEscrow } from '@/types/ui.types'
import type { Escrow } from '@/types/ui.types'

export const ESCROW_QUERY_KEYS = {
  balance: ['escrow', 'balance'] as const,
  walletBalance: (address: string) => ['wallet', 'balance', address] as const,
}

export function useEscrowBalanceQuery(sync: boolean = false) {
  return useQuery<Escrow>({
    queryKey: [...ESCROW_QUERY_KEYS.balance, sync],
    queryFn: async () => {
      const token = storage.getToken()
      if (token) {
        setAuthToken(token)
      }
      const apiEscrow = await escrowApi.getEscrowBalance(sync)
      return transformEscrow(apiEscrow)
    },
    enabled: storage.hasToken(),
    staleTime: sync ? 0 : 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
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
