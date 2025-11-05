/**
 * Escrow Mutation Hooks
 * React Query mutations for escrow operations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { escrowApi } from '@/lib/api'
import { transformEscrow } from '@/types/ui.types'
import { ESCROW_QUERY_KEYS } from '../queries/use-escrow-queries'
import type { Escrow } from '@/types/ui.types'

interface InitializeEscrowResult {
  escrow: Escrow
  txHash: string
}

interface DepositResult {
  escrow: Escrow
  txHash: string
}

export function useInitializeEscrowMutation() {
  const queryClient = useQueryClient()
  const { signTransaction } = useWallet()

  return useMutation<InitializeEscrowResult, Error, void>({
    mutationFn: async () => {
      if (!signTransaction) {
        throw new Error('Wallet does not support transaction signing')
      }

      const prepareResponse = await escrowApi.prepareInitializeEscrow()

      const transaction = Transaction.from(
        Buffer.from(prepareResponse.transaction, 'base64')
      )

      const signedTx = await signTransaction(transaction)
      const signedTxBase64 = signedTx.serialize().toString('base64')

      const response = await escrowApi.submitInitializeEscrow(signedTxBase64)

      const escrow = transformEscrow({
        escrow_account: response.escrow_account,
        balance: response.balance,
        token_mint: response.token_mint,
        is_initialized: true,
        initialized_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      })

      return {
        escrow,
        txHash: response.tx_signature,
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(ESCROW_QUERY_KEYS.balance, data.escrow)
      queryClient.invalidateQueries({ queryKey: ESCROW_QUERY_KEYS.balance })
    },
    retry: 1,
  })
}

export function useDepositToEscrowMutation() {
  const queryClient = useQueryClient()
  const { signTransaction } = useWallet()

  return useMutation<DepositResult, Error, string>({
    mutationFn: async (amount: string) => {
      if (!signTransaction) {
        throw new Error('Wallet does not support transaction signing')
      }

      const prepareResponse = await escrowApi.prepareDeposit(amount)

      const transaction = Transaction.from(
        Buffer.from(prepareResponse.transaction, 'base64')
      )

      const signedTx = await signTransaction(transaction)
      const signedTxBase64 = signedTx.serialize().toString('base64')

      const response = await escrowApi.submitDeposit(amount, signedTxBase64)

      const currentBalance = queryClient.getQueryData<Escrow>(
        ESCROW_QUERY_KEYS.balance
      )

      const newBalance = currentBalance
        ? (parseFloat(currentBalance.balance) + parseFloat(amount)).toString()
        : amount

      const escrow = transformEscrow({
        escrow_account: currentBalance?.escrowAccount || '',
        balance: newBalance,
        token_mint: 'USDC',
        is_initialized: true,
        initialized_at: currentBalance?.initializedAt || new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      })

      return {
        escrow,
        txHash: response.tx_signature,
      }
    },
    onSuccess: (data) => {
      // Only invalidate escrow balance - wallet balance refetches on modal open
      queryClient.setQueryData(ESCROW_QUERY_KEYS.balance, data.escrow)
      queryClient.invalidateQueries({ queryKey: ESCROW_QUERY_KEYS.balance })
    },
    retry: 1,
  })
}
