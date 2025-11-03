/**
 * Legal Documents Hook
 * Helper hook for working with legal documents
 */
import { useMemo } from 'react'
import { useLegalDocumentsQuery } from './queries'
import type { LegalDocument } from '@/types/ui.types'

export function useLegalDocuments() {
  const { data: legalDocuments = [], isLoading, error } = useLegalDocumentsQuery()

  const termsOfService = useMemo(
    () => legalDocuments.find((doc) => doc.documentType === 'terms_of_service'),
    [legalDocuments]
  )

  const privacyPolicy = useMemo(
    () => legalDocuments.find((doc) => doc.documentType === 'privacy_policy'),
    [legalDocuments]
  )

  const cookiePolicy = useMemo(
    () => legalDocuments.find((doc) => doc.documentType === 'cookie_policy'),
    [legalDocuments]
  )

  const getDocumentsByType = (
    type: 'terms_of_service' | 'privacy_policy' | 'cookie_policy'
  ): LegalDocument | undefined => {
    return legalDocuments.find((doc) => doc.documentType === type)
  }

  return {
    legalDocuments,
    termsOfService,
    privacyPolicy,
    cookiePolicy,
    getDocumentsByType,
    isLoading,
    error,
  }
}
