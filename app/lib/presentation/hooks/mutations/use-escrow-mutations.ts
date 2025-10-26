/**
 * Escrow Mutation Hooks
 * 
 * React Query hooks for escrow operations (initialize, deposit, withdraw).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { container } from '@/lib/infrastructure/di/container'
import { ESCROW_QUERY_KEYS } from '../queries/use-escrow-queries'
import type { InitializeEscrowResult, DepositResult } from '@/lib/application/services/escrow.service'

/**
 * Initialize escrow account
 */
export function useInitializeEscrowMutation() {
  const queryClient = useQueryClient()
  const escrowService = container.escrowService
  
  return useMutation<InitializeEscrowResult, Error, void>({
    mutationFn: async () => {
      return await escrowService.initializeEscrow()
    },
    onSuccess: (data) => {
      // Update escrow balance cache
      queryClient.setQueryData(ESCROW_QUERY_KEYS.balance, data.escrow)
      
      // Invalidate to refetch with latest data
      queryClient.invalidateQueries({ queryKey: ESCROW_QUERY_KEYS.balance })
    },
    retry: 1,
  })
}

/**
 * Deposit to escrow
 */
export function useDepositToEscrowMutation() {
  const queryClient = useQueryClient()
  const escrowService = container.escrowService
  
  return useMutation<DepositResult, Error, string>({
    mutationFn: async (amount: string) => {
      return await escrowService.depositToEscrow(amount)
    },
    onSuccess: (data) => {
      // Update escrow balance cache
      queryClient.setQueryData(ESCROW_QUERY_KEYS.balance, data.escrow)
      
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ESCROW_QUERY_KEYS.balance })
      queryClient.invalidateQueries({ queryKey: ESCROW_QUERY_KEYS.walletBalance })
    },
    retry: 1,
  })
}
