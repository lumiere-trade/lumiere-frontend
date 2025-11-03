/**
 * UI Types
 * Transformed types for component usage (camelCase)
 */
import type { User as ApiUser, PendingDocument as ApiPendingDocument, LegalDocument as ApiLegalDocument, Escrow as ApiEscrow } from '@/lib/api/types'

export interface User {
  id: string
  walletAddress: string
  walletType: string
  createdAt: string
}

export interface PendingDocument {
  id: string
  documentType: string
  version: string
  title: string
}

export interface LegalDocument {
  id: string
  documentType: string
  version: string
  title: string
  content: string
  status: string
  effectiveDate: string
  createdAt: string
  updatedAt: string
}

export interface Escrow {
  escrowAccount: string | null
  balance: string
  tokenMint: string
  isInitialized: boolean
  initializedAt: string | null
  lastSyncedAt: string | null
}

export function transformUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    walletAddress: apiUser.wallet_address,
    walletType: apiUser.wallet_type,
    createdAt: apiUser.created_at,
  }
}

export function transformPendingDocument(apiDoc: ApiPendingDocument): PendingDocument {
  return {
    id: apiDoc.id,
    documentType: apiDoc.document_type,
    version: apiDoc.version,
    title: apiDoc.title,
  }
}

export function transformLegalDocument(apiDoc: ApiLegalDocument): LegalDocument {
  return {
    id: apiDoc.id,
    documentType: apiDoc.document_type,
    version: apiDoc.version,
    title: apiDoc.title,
    content: apiDoc.content,
    status: apiDoc.status,
    effectiveDate: apiDoc.effective_date,
    createdAt: apiDoc.created_at,
    updatedAt: apiDoc.updated_at,
  }
}

export function transformEscrow(apiEscrow: ApiEscrow): Escrow {
  return {
    escrowAccount: apiEscrow.escrow_account,
    balance: apiEscrow.balance,
    tokenMint: apiEscrow.token_mint,
    isInitialized: apiEscrow.is_initialized,
    initializedAt: apiEscrow.initialized_at,
    lastSyncedAt: apiEscrow.last_synced_at,
  }
}
