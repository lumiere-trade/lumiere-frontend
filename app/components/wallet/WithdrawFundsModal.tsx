'use client'

/**
 * Withdraw Funds Modal
 *
 * Allows user to withdraw USDC from escrow account back to wallet.
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@lumiere/shared/components/ui/dialog'
import { Button } from '@lumiere/shared/components/ui/button'
import { Input } from '@lumiere/shared/components/ui/input'
import { Label } from '@lumiere/shared/components/ui/label'
import { useEscrow } from '@/hooks/use-escrow'
import { useWithdrawFromEscrowMutation } from '@/hooks/mutations/use-escrow-mutations'
import { useToast } from '@/hooks/use-toast'
import { useLogger } from '@/hooks/use-logger'
import { LogCategory } from '@/lib/debug'

interface WithdrawFundsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WithdrawFundsModal({ isOpen, onClose }: WithdrawFundsModalProps) {
  const log = useLogger('WithdrawFundsModal', LogCategory.ESCROW)
  const [amount, setAmount] = useState('')
  const { toast } = useToast()

  // Escrow operations
  const {
    escrowBalance,
    isInitialized,
    isLoading: isLoadingEscrow,
  } = useEscrow()

  // Withdraw mutation
  const withdrawMutation = useWithdrawFromEscrowMutation()

  useEffect(() => {
    if (isOpen) {
      log.info('Withdraw modal opened', {
        escrowBalance,
        isInitialized
      })
    } else {
      log.info('Withdraw modal closed')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setAmount('')
      log.debug('Amount reset on modal close')
    }
  }, [isOpen])

  const handleMaxClick = () => {
    log.info('MAX button clicked', { escrowBalance })
    setAmount(escrowBalance)
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    if (value) {
      log.debug('Amount changed', { amount: value })
    }
  }

  const handleConfirmWithdraw = async () => {
    log.group('Withdraw Flow')
    log.time('withdraw')
    log.info('Withdraw initiated', { amount, isInitialized })

    if (!amount || parseFloat(amount) <= 0) {
      log.warn('Invalid amount provided', { amount })
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      })
      log.groupEnd()
      return
    }

    const amountNum = parseFloat(amount)
    const escrowBalanceNum = parseFloat(escrowBalance)

    if (amountNum > escrowBalanceNum) {
      log.warn('Insufficient escrow balance', {
        requested: amountNum,
        available: escrowBalanceNum
      })
      toast({
        title: 'Insufficient Balance',
        description: `You only have ${escrowBalance} USDC in escrow`,
        variant: 'destructive',
      })
      log.groupEnd()
      return
    }

    if (!isInitialized) {
      log.warn('Escrow not initialized')
      toast({
        title: 'Escrow Not Initialized',
        description: 'Please deposit funds first',
        variant: 'destructive',
      })
      log.groupEnd()
      return
    }

    try {
      log.info('Executing withdraw mutation', { amount })

      const result = await withdrawMutation.mutateAsync(amount)

      log.info('Withdraw successful', {
        txHash: result.txHash,
        newBalance: result.escrow.balance
      })

      toast({
        title: 'Withdraw Successful',
        description: `Successfully withdrew ${amount} USDC to your wallet`,
      })

      log.timeEnd('withdraw')
      log.groupEnd()
      onClose()
    } catch (err: any) {
      log.error('Withdraw flow failed', {
        error: err.message,
        amount
      })

      toast({
        title: 'Withdraw Failed',
        description: err.message || 'Failed to withdraw funds',
        variant: 'destructive',
      })

      log.timeEnd('withdraw')
      log.groupEnd()
    }
  }

  const displayAmount = amount || '0.00'
  const isProcessing = withdrawMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border border-primary/30 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Withdraw Funds</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-semibold text-muted-foreground">
              Amount (USDC)
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={isProcessing || isLoadingEscrow}
                autoComplete="off" className="pr-16 rounded-lg border-primary/30 bg-background text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMaxClick}
                disabled={isProcessing || isLoadingEscrow}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 rounded-md bg-primary/20 hover:bg-primary/30 font-semibold text-primary text-xs"
              >
                MAX
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Available in escrow:{' '}
              {isLoadingEscrow ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                <span className="font-semibold text-primary">{escrowBalance} USDC</span>
              )}
            </p>
          </div>

          <div className="rounded-lg border border-primary/20 bg-background/50 p-4">
            <div className="mb-2 text-base text-muted-foreground">Withdraw Summary</div>
            <div className="flex items-center justify-between">
              <span className="text-base">You will withdraw</span>
              <span className="font-semibold text-primary text-lg">{displayAmount} USDC</span>
            </div>
          </div>

          <Button
            onClick={handleConfirmWithdraw}
            disabled={isProcessing || isLoadingEscrow || !amount || parseFloat(amount) <= 0 || !isInitialized}
            className="w-full rounded-full py-6 text-lg font-semibold"
          >
            {isProcessing ? 'PROCESSING WITHDRAW...' : 'CONFIRM WITHDRAW'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Funds will be returned to your wallet. Gas fees may apply.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
