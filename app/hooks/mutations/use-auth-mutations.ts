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

interface LoginParams {
  walletAddress?: string
  signature?: string
  walletType?: string
}

interface CreateAccountParams {
  acceptedDocumentIds: string[]
  walletAddress?: string
  signature?: string
  walletType?: string
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

  return useMutation<LoginResult, Error, LoginParams | void>({
    mutationFn: async (params) => {
      let walletAddress: string
      let signatureBase58: string
      let walletType: string

      if (params && params.signature && params.walletAddress && params.walletType) {
        walletAddress = params.walletAddress
        signatureBase58 = params.signature
        walletType = params.walletType
      } else {
        if (!publicKey || !signMessage) {
          throw new Error('Wallet not connected')
        }

        walletAddress = publicKey.toBase58()
        const message = AUTH_CONFIG.MESSAGE
        const encodedMessage = new TextEncoder().encode(message)
        const signature = await signMessage(encodedMessage)
        signatureBase58 = Buffer.from(signature).toString('base64')
        walletType = 'Phantom'

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
      }

      const message = AUTH_CONFIG.MESSAGE
      const loginResponse = await authApi.login(
        walletAddress,
        message,
        signatureBase58,
        walletType
      )

      console.log('[AUTH-DEBUG] Login response received:', {
        has_access_token: 'access_token' in loginResponse,
        token_length: loginResponse.access_token?.length,
        token_preview: loginResponse.access_token?.substring(0, 20) + '...'
      })

      console.log('[AUTH-DEBUG] Calling storage.setToken...')
      storage.setToken(loginResponse.access_token)

      console.log('[AUTH-DEBUG] Verifying token was saved...')
      const savedToken = storage.getToken()
      console.log('[AUTH-DEBUG] Token saved successfully?', savedToken !== null, {
        saved_length: savedToken?.length,
        matches: savedToken === loginResponse.access_token
      })

      console.log('[AUTH-DEBUG] Calling setAuthToken...')
      setAuthToken(loginResponse.access_token)

      const user = transformUser({
        id: loginResponse.user_id,
        wallet_address: loginResponse.wallet_address,
        wallet_type: walletType,
        created_at: new Date().toISOString(),
      })

      return {
        user,
        pendingDocuments: loginResponse.pending_documents.map(transformPendingDocument),
      }
    },
    onSuccess: (data) => {
      console.log('[AUTH-DEBUG] onSuccess called, checking token again...')
      const token = storage.getToken()
      console.log('[AUTH-DEBUG] Token in onSuccess:', token?.substring(0, 20))

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
    mutationFn: async (params) => {
      let walletAddress: string
      let signatureBase58: string
      let walletType: string

      if (params.signature && params.walletAddress && params.walletType) {
        walletAddress = params.walletAddress
        signatureBase58 = params.signature
        walletType = params.walletType
      } else {
        if (!publicKey || !signMessage) {
          throw new Error('Wallet not connected')
        }

        walletAddress = publicKey.toBase58()
        const message = AUTH_CONFIG.MESSAGE
        const encodedMessage = new TextEncoder().encode(message)
        const signature = await signMessage(encodedMessage)
        signatureBase58 = Buffer.from(signature).toString('base64')
        walletType = 'Phantom'
      }

      const message = AUTH_CONFIG.MESSAGE
      const response = await authApi.createAccount(
        walletAddress,
        message,
        signatureBase58,
        walletType,
        params.acceptedDocumentIds
      )

      storage.setToken(response.access_token)
      setAuthToken(response.access_token)

      const user = transformUser({
        id: response.user_id,
        wallet_address: response.wallet_address,
        wallet_type: walletType,
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
