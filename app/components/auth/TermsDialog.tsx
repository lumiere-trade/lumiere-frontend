"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from '@lumiere/shared/components/ui/button'
import { Checkbox } from '@lumiere/shared/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@lumiere/shared/components/ui/dialog'
import { Loader2 } from "lucide-react"
import { useLegalDocuments } from "@/hooks/use-legal-documents"
import { useCreateAccountMutation } from "@/hooks/mutations/use-auth-mutations"
import { logger, LogCategory } from "@/lib/debug"

interface TermsDialogProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
  signature: string
  walletType: string
}

export function TermsDialog({
  isOpen,
  onClose,
  walletAddress,
  signature,
  walletType
}: TermsDialogProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { legalDocuments, isLoading: isLoadingLegalDocs } = useLegalDocuments()
  const createAccountMutation = useCreateAccountMutation()

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const isBottom = scrollTop + clientHeight >= scrollHeight - 10
      setHasScrolledToBottom(isBottom)
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [legalDocuments])

  const handleConfirmTerms = async () => {
    if (!agreedToTerms || !hasScrolledToBottom) return

    try {
      const acceptedDocIds = legalDocuments.map((doc) => doc.id)

      await createAccountMutation.mutateAsync({
        acceptedDocumentIds: acceptedDocIds,
        walletAddress,
        signature,
        walletType
      })

      onClose()
    } catch (error: any) {
      logger.error(LogCategory.AUTH, 'Account creation failed:', error)
      setError(error.message || 'Account creation failed. Please try again.')
    }
  }

  const handleCancel = () => {
    setAgreedToTerms(false)
    setHasScrolledToBottom(false)
    setError(null)
    onClose()
  }

  const formatContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, index) => {
      const trimmedLine = line.trim()

      if (/^\d+\.\s+[A-Z\s]+$/.test(trimmedLine)) {
        return (
          <p key={index} className="font-bold text-muted-foreground mt-4 mb-2 break-words">
            {trimmedLine}
          </p>
        )
      }

      if (trimmedLine) {
        return (
          <p key={index} className="text-sm text-muted-foreground mb-2 break-words">
            {trimmedLine}
          </p>
        )
      }

      return null
    })
  }

  const canConfirm = agreedToTerms && hasScrolledToBottom && !createAccountMutation.isPending && !isLoadingLegalDocs

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent
        className="max-w-lg max-h-[50vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Terms & Conditions</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden pr-4">
            <div className="space-y-4">
              {isLoadingLegalDocs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : legalDocuments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No legal documents available
                </div>
              ) : (
                legalDocuments.map((doc) => (
                  <div key={doc.id} className="space-y-3 p-4 bg-card/50 rounded-lg border border-primary/20">
                    <h3 className="font-bold text-lg text-foreground break-words">{doc.title}</h3>
                    <div className="text-sm">
                      {formatContent(doc.content)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-card/50 rounded-lg border border-primary/20 flex-shrink-0">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-foreground cursor-pointer flex-1">
              I have read and agree to all the terms and conditions above
            </label>
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="rounded-full"
              disabled={createAccountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTerms}
              disabled={!canConfirm}
              className="rounded-full"
            >
              {createAccountMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Confirm & Continue'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
