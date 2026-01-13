/**
 * Auth API Functions
 * Simple functions for authentication endpoints
 */
import { get, post } from './client'
import type {
  VerifyWalletResponse,
  LoginResponse,
  CreateAccountResponse,
  User,
  CheckComplianceResponse,
  LegalDocument,
} from './types'

export async function verifyWallet(
  walletAddress: string,
  message: string,
  signature: string
): Promise<VerifyWalletResponse> {
  return post<VerifyWalletResponse>('/api/auth/verify', {
    wallet_address: walletAddress,
    message,
    signature,
  })
}

export async function login(
  walletAddress: string,
  message: string,
  signature: string,
  walletType: string
): Promise<LoginResponse> {
  return post<LoginResponse>('/api/auth/login', {
    wallet_address: walletAddress,
    message,
    signature,
    wallet_type: walletType,
  })
}

export async function createAccount(
  walletAddress: string,
  message: string,
  signature: string,
  walletType: string,
  acceptedDocuments: string[]
): Promise<CreateAccountResponse> {
  return post<CreateAccountResponse>('/api/auth/create-account', {
    wallet_address: walletAddress,
    message,
    signature,
    wallet_type: walletType,
    accepted_documents: acceptedDocuments,
    ip_address: '127.0.0.1',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
  })
}

export async function getCurrentUser(): Promise<User> {
  return get<User>('/api/users/me')
}

export async function checkCompliance(): Promise<CheckComplianceResponse> {
  return get<CheckComplianceResponse>('/api/legal/compliance')
}

export async function acceptDocuments(documentIds: string[]): Promise<void> {
  await post('/api/legal/accept-documents', {
    document_ids: documentIds,
  })
}

export async function getLegalDocuments(): Promise<LegalDocument[]> {
  return get<LegalDocument[]>('/api/legal/documents')
}

// Export as object for backward compatibility
export const authApi = {
  verifyWallet,
  login,
  createAccount,
  getCurrentUser,
  checkCompliance,
  acceptDocuments,
  getLegalDocuments,
}
