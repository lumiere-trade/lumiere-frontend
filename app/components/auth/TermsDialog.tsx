"use client"

import { useState } from "react"
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
  const [error, setError] = useState<string | null>(null)

  const { legalDocuments, isLoading: isLoadingLegalDocs } = useLegalDocuments()
  const createAccountMutation = useCreateAccountMutation()

  const handleConfirmTerms = async () => {
    if (!agreedToTerms) return

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
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Terms & Conditions</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto pr-4">
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
                  <div key={doc.id} className="space-y-2 p-4 bg-card/50 rounded-lg border border-primary/20">
                    <h3 className="font-semibold text-lg text-foreground">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {doc.content}
                    </p>
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
              disabled={!agreedToTerms || createAccountMutation.isPending || isLoadingLegalDocs}
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
