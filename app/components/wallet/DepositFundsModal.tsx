'use client'

/**
 * Deposit Funds Modal
 *
 * Allows user to deposit USDC to escrow account.
 * Auto-initializes escrow if not already initialized.
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@lumiere/shared/components/ui/dialog'
import { Button } from '@lumiere/shared/components/ui/button'
import { Input } from '@lumiere/shared/components/ui/input'
import { Label } from '@lumiere/shared/components/ui/label'
import { useEscrow } from '@/hooks/use-escrow'
import { useWalletBalance } from '@/hooks/use-wallet-balance'
import { useToast } from '@/hooks/use-toast'
import { useLogger } from '@/hooks/use-logger'
import { LogCategory } from '@/lib/debug'

interface DepositFundsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DepositFundsModal({ isOpen, onClose }: DepositFundsModalProps) {
  const log = useLogger('DepositFundsModal', LogCategory.ESCROW)
  const [amount, setAmount] = useState('')
  const { toast } = useToast()

  // Wallet balance (from authenticated user)
  const {
    balance: walletBalance,
    isLoading: isLoadingWallet,
    error: walletError,
  } = useWalletBalance()

  // Escrow operations
  const {
    escrowBalance,
    isInitialized,
    isLoading: isLoadingEscrow,
    isInitializing,
    isDepositing,
    initializeEscrow,
    depositToEscrow,
    error: escrowError,
  } = useEscrow()

  const error = walletError || escrowError

  useEffect(() => {
    if (isOpen) {
      log.info('Deposit modal opened', {
        walletBalance,
        escrowBalance,
        isInitialized
      })
    } else {
      log.info('Deposit modal closed')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setAmount('')
      log.debug('Amount reset on modal close')
    }
  }, [isOpen])

  useEffect(() => {
    if (error) {
      log.error('Error detected', error)
    }
  }, [error])

  const handleMaxClick = () => {
    log.info('MAX button clicked', { walletBalance })
    setAmount(walletBalance)
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    if (value) {
      log.debug('Amount changed', { amount: value })
    }
  }

  const handleConfirmDeposit = async () => {
    log.group('Deposit Flow')
    log.time('deposit')
    log.info('Deposit initiated', { amount, isInitialized })

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
    const walletBalanceNum = parseFloat(walletBalance)

    if (amountNum > walletBalanceNum) {
      log.warn('Insufficient balance', {
        requested: amountNum,
        available: walletBalanceNum
      })
      toast({
        title: 'Insufficient Balance',
        description: `You only have ${walletBalance} USDC available`,
        variant: 'destructive',
      })
      log.groupEnd()
      return
    }

    try {
      // Step 1: Initialize escrow if needed
      if (!isInitialized) {
        log.info('Escrow not initialized, initializing now...')
        
        await initializeEscrow()
        
        log.info('Escrow initialized successfully')
        toast({
          title: 'Escrow Initialized',
          description: 'Your escrow account has been created',
        })
      }

      // Step 2: Deposit funds
      log.info('Depositing funds', { amount })
      await depositToEscrow(amount)

      log.info('Deposit successful', {
        amount,
        newBalance: escrowBalance
      })

      toast({
        title: 'Deposit Successful',
        description: `Deposited ${amount} USDC to escrow`,
      })

      log.timeEnd('deposit')
      log.groupEnd()
      onClose()
    } catch (err: any) {
      log.error('Deposit flow failed', {
        error: err.message,
        amount,
        wasInitialized: isInitialized
      })

      toast({
        title: 'Deposit Failed',
        description: err.message || 'Failed to deposit funds',
        variant: 'destructive',
      })

      log.timeEnd('deposit')
      log.groupEnd()
    }
  }

  const displayAmount = amount || '0.00'
  const isProcessing = isInitializing || isDepositing

  useEffect(() => {
    if (isProcessing) {
      log.info('Processing state changed', {
        isInitializing,
        isDepositing
      })
    }
  }, [isProcessing, isInitializing, isDepositing])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border border-primary/30 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Deposit Funds</DialogTitle>
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
                disabled={isProcessing || isLoadingWallet}
                className="pr-16 rounded-lg border-primary/30 bg-background text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMaxClick}
                disabled={isProcessing || isLoadingWallet}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 rounded-md bg-primary/20 hover:bg-primary/30 font-semibold text-primary text-xs"
              >
                MAX
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Available:{' '}
              {isLoadingWallet ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                <span className="font-semibold text-primary">{walletBalance} USDC</span>
              )}
            </p>
          </div>

          <div className="rounded-lg border border-primary/20 bg-background/50 p-4">
            <div className="mb-2 text-base text-muted-foreground">Deposit Summary</div>
            <div className="flex items-center justify-between">
              <span className="text-base">You will deposit</span>
              <span className="font-semibold text-primary text-lg">{displayAmount} USDC</span>
            </div>
          </div>

          <Button
            onClick={handleConfirmDeposit}
            disabled={isProcessing || isLoadingWallet || !amount || parseFloat(amount) <= 0}
            className="w-full rounded-full py-6 text-lg font-semibold"
          >
            {isInitializing
              ? 'INITIALIZING ESCROW...'
              : isDepositing
              ? 'PROCESSING DEPOSIT...'
              : 'CONFIRM DEPOSIT'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {!isInitialized && amount && parseFloat(amount) > 0 ? (
              <>Escrow will be automatically initialized for your first deposit.</>
            ) : (
              <>Deposits are processed instantly. Gas fees may apply.</>
            )}
          </p>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error.message}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
