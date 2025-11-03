/**
 * Auth Mutation Hooks
 * React Query mutations for authentication operations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { authApi, storage, setAuthToken, clearAuthToken } from '@/lib/api'
import { transformUser, transformPendingDocument } from '@/types/ui.types'
import { AUTH_QUERY_KEYS } from '../queries/use-auth-queries'
import { ESCROW_QUERY_KEYS } from '../queries/use-escrow-queries'
import { ROUTES, AUTH_CONFIG } from '@/config/constants'
import type { User, PendingDocument } from '@/types/ui.types'

interface LoginResult {
  user: User
  pendingDocuments: PendingDocument[]
}

interface CreateAccountParams {
  acceptedDocumentIds: string[]
}

interface CreateAccountResult {
  user: User
}

interface AcceptDocumentsParams {
  documentIds: string[]
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { publicKey, signMessage } = useWallet()

  return useMutation<LoginResult, Error, void>({
    mutationFn: async () => {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet not connected')
      }

      const walletAddress = publicKey.toBase58()
      const message = AUTH_CONFIG.MESSAGE
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)
      const signatureBase58 = Buffer.from(signature).toString('base64')

      const verifyResult = await authApi.verifyWallet(
        walletAddress,
        message,
        signatureBase58
      )

      if (!verifyResult.signature_valid) {
        throw new Error('Invalid signature')
      }

      if (!verifyResult.user_exists) {
        throw new Error('User not found. Please create an account.')
      }

      const loginResponse = await authApi.login(
        walletAddress,
        message,
        signatureBase58,
        'Phantom'
      )

      storage.setToken(loginResponse.access_token)
      setAuthToken(loginResponse.access_token)

      const user = transformUser({
        id: loginResponse.user_id,
        wallet_address: loginResponse.wallet_address,
        wallet_type: 'Phantom',
        created_at: new Date().toISOString(),
      })

      return {
        user,
        pendingDocuments: loginResponse.pending_documents.map(transformPendingDocument),
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, data.user)
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.currentUser })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.compliance })
      queryClient.invalidateQueries({ queryKey: ESCROW_QUERY_KEYS.balance })

      if (data.pendingDocuments.length > 0) {
        router.push('/onboarding')
      } else {
        router.push(ROUTES.DASHBOARD)
      }
    },
  })
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { publicKey, signMessage } = useWallet()

  return useMutation<CreateAccountResult, Error, CreateAccountParams>({
    mutationFn: async ({ acceptedDocumentIds }) => {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet not connected')
      }

      const walletAddress = publicKey.toBase58()
      const message = AUTH_CONFIG.MESSAGE
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)
      const signatureBase58 = Buffer.from(signature).toString('base64')

      const response = await authApi.createAccount(
        walletAddress,
        message,
        signatureBase58,
        'Phantom',
        acceptedDocumentIds
      )

      storage.setToken(response.access_token)
      setAuthToken(response.access_token)

      const user = transformUser({
        id: response.user_id,
        wallet_address: response.wallet_address,
        wallet_type: 'Phantom',
        created_at: new Date().toISOString(),
      })

      return { user }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, data.user)
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.currentUser })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.compliance })
      router.push(ROUTES.DASHBOARD)
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { disconnect } = useWallet()

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      storage.removeToken()
      clearAuthToken()
      await disconnect()
    },
    onSuccess: () => {
      queryClient.clear()
      router.push(ROUTES.HOME)
    },
  })
}

export function useAcceptDocumentsMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, AcceptDocumentsParams>({
    mutationFn: async ({ documentIds }) => {
      await authApi.acceptDocuments(documentIds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.currentUser })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.compliance })
    },
  })
}
