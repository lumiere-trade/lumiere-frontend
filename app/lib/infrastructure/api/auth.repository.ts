import { IAuthRepository } from '@/lib/domain/interfaces/auth.repository.interface'
import { BaseApiClient } from './base-api.client'
import {
  VerifyWalletRequest,
  VerifyWalletResponse,
  LoginRequest,
  LoginResponse,
  CreateAccountRequest,
  CreateAccountResponse,
  CheckComplianceResponse,
  AcceptDocumentsRequest,
} from '@/types/api.types'
import { User } from '@/lib/domain/entities/user.entity'
import { PendingDocument } from '@/lib/domain/entities/pending-document.entity'
import { LegalDocument } from '@/lib/domain/entities/legal-document.entity'

export interface VerifyWalletResult {
  signatureValid: boolean
  userExists: boolean
}

export interface LoginResult {
  user: User
  accessToken: string
  pendingDocuments: PendingDocument[]
}

export interface CreateAccountResult {
  user: User
  accessToken: string
}

export interface CheckComplianceResult {
  missingDocuments: PendingDocument[]
}

export class AuthRepository implements IAuthRepository {
  constructor(private readonly apiClient: BaseApiClient) {}

  setAuthToken(token: string): void {
    this.apiClient.setAuthToken(token)
  }

  clearAuthToken(): void {
    this.apiClient.clearAuthToken()
  }

  hasAuthToken(): boolean {
    return this.apiClient.hasAuthToken()
  }

  async verifyWallet(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<VerifyWalletResult> {
    const request: VerifyWalletRequest = {
      wallet_address: walletAddress,
      message,
      signature,
    }

    const response = await this.apiClient.post<VerifyWalletResponse>(
      '/api/auth/verify',
      request
    )

    return {
      signatureValid: response.signature_valid,
      userExists: response.user_exists,
    }
  }

  async login(
    walletAddress: string,
    message: string,
    signature: string,
    walletType: string
  ): Promise<LoginResult> {
    const request: LoginRequest = {
      wallet_address: walletAddress,
      message,
      signature,
      wallet_type: walletType,
    }

    const response = await this.apiClient.post<LoginResponse>(
      '/api/auth/login',
      request
    )

    const pendingDocuments = (response.pending_documents || []).map((doc) =>
      PendingDocument.fromApi(doc)
    )

    const user = User.fromApi({
      id: response.user_id,
      wallet_address: response.wallet_address,
      wallet_type: walletType,
      created_at: new Date().toISOString(),
      pending_documents: pendingDocuments.map(doc => ({
        id: doc.id,
        document_type: doc.documentType,
        version: doc.version,
        title: doc.title,
        content: '',
        status: 'active',
        effective_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    })

    return {
      user,
      accessToken: response.access_token,
      pendingDocuments,
    }
  }

  async createAccount(
    walletAddress: string,
    message: string,
    signature: string,
    walletType: string,
    acceptedDocumentIds: string[]
  ): Promise<CreateAccountResult> {
    const request: CreateAccountRequest = {
      wallet_address: walletAddress,
      message,
      signature,
      wallet_type: walletType,
      accepted_documents: acceptedDocumentIds,
      ip_address: '127.0.0.1',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    }

    const response = await this.apiClient.post<CreateAccountResponse>(
      '/api/auth/create-account',
      request
    )

    const user = User.fromApi({
      id: response.user_id,
      wallet_address: response.wallet_address,
      wallet_type: walletType,
      created_at: new Date().toISOString(),
      pending_documents: [],
    })

    return {
      user,
      accessToken: response.access_token,
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.apiClient.get<any>('/api/users/me')

    return User.fromApi({
      id: response.id,
      wallet_address: response.wallet_address,
      wallet_type: response.wallet_type || 'Unknown',
      created_at: response.created_at,
      pending_documents: response.pending_documents || [],
    })
  }

  async checkCompliance(): Promise<CheckComplianceResult> {
    const response = await this.apiClient.get<CheckComplianceResponse>(
      '/api/legal/compliance'
    )

    const missingDocuments = (response.pending_documents || []).map((doc) =>
      PendingDocument.fromApi(doc)
    )

    return {
      missingDocuments,
    }
  }

  async acceptDocuments(documentIds: string[]): Promise<void> {
    const request: AcceptDocumentsRequest = {
      document_ids: documentIds,
    }

    await this.apiClient.post('/api/legal/accept-documents', request)
  }

  async getLegalDocuments(): Promise<LegalDocument[]> {
    const response = await this.apiClient.get<any[]>(
      '/api/legal/documents'
    )

    return response.map((doc) => LegalDocument.fromApi(doc))
  }
}
