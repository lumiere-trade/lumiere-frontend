"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@lumiere/shared/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiere/shared/components/ui/tabs'
import { Button } from '@lumiere/shared/components/ui/button'
import { Wallet, Copy, DollarSign } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useAuth } from "@/hooks/use-auth"
import { useLogger } from "@/hooks/use-logger"
import { useToast } from "@/hooks/use-toast"
import { useWalletBalance } from "@/hooks/use-wallet-balance"
import { useEscrow } from "@/hooks/use-escrow"
import { useEscrowTransactionsQuery } from "@/hooks/queries/use-escrow-queries"
import { DepositFundsModal } from "@/components/wallet/DepositFundsModal"
import { WithdrawFundsModal } from "@/components/wallet/WithdrawFundsModal"
import { TransactionList } from "@/components/wallet/TransactionList"
import { LogCategory } from "@/lib/debug"

interface WalletPanelProps {
  trigger?: React.ReactNode
}

export function WalletPanel({ trigger }: WalletPanelProps) {
  const log = useLogger('WalletPanel', LogCategory.WALLET)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('balances')
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const { user, logout } = useAuth()
  const { disconnect } = useWallet()
  const { balance: walletBalance, isLoading: isLoadingWallet, refetch: refetchWalletBalance } = useWalletBalance()
  const { escrowBalance, isLoading: isLoadingEscrow, refetch: refetchEscrowBalance } = useEscrow()
  const { data: transactionsData, isLoading: isLoadingTransactions, refetch: refetchTransactions } = useEscrowTransactionsQuery()

  const walletAddress = user?.walletAddress ? `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}` : "Not connected"
  const walletType = user?.walletType || "Unknown Wallet"

  // Calculate real balances
  const walletBalanceNum = parseFloat(walletBalance)
  const escrowBalanceNum = parseFloat(escrowBalance)
  const totalBalance = walletBalanceNum + escrowBalanceNum
  const isLoading = isLoadingWallet || isLoadingEscrow

  useEffect(() => {
    if (open) {
      log.info('Wallet panel opened - refreshing data')
      refetchWalletBalance()
      refetchEscrowBalance()
      refetchTransactions()
    } else {
      log.info('Wallet panel closed')
    }
  }, [open])

  useEffect(() => {
    if (open) {
      log.info('Tab changed', { tab: activeTab })

      if (activeTab === 'balances') {
        log.info('Refreshing balance data')
        refetchWalletBalance()
        refetchEscrowBalance()
      } else if (activeTab === 'activity') {
        log.info('Refreshing transactions')
        refetchTransactions()
      }
    }
  }, [activeTab, open])

  const handleCopyAddress = () => {
    if (user?.walletAddress) {
      log.info('Copying wallet address')
      navigator.clipboard.writeText(user.walletAddress)
      toast({
        title: "Address copied!",
        description: "Wallet address copied to clipboard",
      })
      log.info('Wallet address copied to clipboard')
    } else {
      log.warn('Attempted to copy address but no wallet connected')
      toast({
        title: "Error",
        description: "No wallet address to copy",
        variant: "destructive",
      })
    }
  }

  const handleDeposit = () => {
    log.info('Deposit button clicked from wallet panel')
    setIsDepositModalOpen(true)
  }

  const handleWithdraw = () => {
    log.info('Withdraw button clicked from wallet panel')
    setIsWithdrawModalOpen(true)
  }

  const handleDisconnect = async () => {
    log.info('Disconnect initiated from wallet panel')
    log.time('disconnect')

    try {
      await disconnect()
      logout()
      log.info('Disconnect successful')
      setOpen(false)
    } catch (error) {
      log.error('Disconnect failed', error)
      logout()
    } finally {
      log.timeEnd('disconnect')
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <Button
              variant="outline"
              size="lg"
              className="rounded-full bg-transparent font-semibold gap-2"
              onClick={() => log.info('Wallet panel trigger clicked')}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              {walletAddress}
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="w-[320px] max-w-[75vw] sm:w-[320px] md:w-[340px] lg:w-[360px] xl:w-[360px] 2xl:w-[500px] bg-background border-l border-primary/20 [&>button]:hidden z-[80]">
          <SheetHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold">{walletAddress}</SheetTitle>
                  <p className="text-sm text-muted-foreground">{walletType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleCopyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-full bg-transparent" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 px-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1">
                <TabsTrigger value="balances" className="hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Balances</TabsTrigger>
                <TabsTrigger value="positions" className="hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Positions</TabsTrigger>
                <TabsTrigger value="activity" className="hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="balances" className="mt-6 space-y-6 px-1">
                <div className="rounded-lg border border-primary/20 bg-card p-6 hover:border-primary/40 transition-colors cursor-pointer">
                  <div className="mb-2 text-sm text-muted-foreground">Total Balance</div>
                  <div className="text-4xl font-bold text-primary">
                    {isLoading ? '...' : `$${totalBalance.toFixed(2)}`}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Deposited Funds
                  </h3>
                  <div className="rounded-lg border border-primary/20 bg-card p-4 hover:border-primary/40 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">USDC</div>
                          <div className="text-sm text-muted-foreground">USD Coin</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">
                            {isLoadingEscrow ? '...' : escrowBalanceNum.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {isLoadingEscrow ? '...' : `$${escrowBalanceNum.toFixed(2)}`}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="rounded-full px-6"
                          onClick={handleWithdraw}
                          disabled={escrowBalanceNum <= 0}
                        >
                          Withdraw
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Wallet Funds
                  </h3>
                  <div className="rounded-lg border border-primary/20 bg-card p-4 hover:border-primary/40 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">USDC</div>
                          <div className="text-sm text-muted-foreground">USD Coin</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">
                            {isLoadingWallet ? '...' : walletBalanceNum.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {isLoadingWallet ? '...' : `$${walletBalanceNum.toFixed(2)}`}
                          </div>
                        </div>
                        <Button size="sm" className="rounded-full px-6" onClick={handleDeposit}>
                          Deposit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="positions" className="mt-6 px-1">
                <div className="text-center py-12 text-muted-foreground">
                  No active positions
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-6 px-1">
                <TransactionList
                  transactions={transactionsData?.transactions || []}
                  isLoading={isLoadingTransactions}
                />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <DepositFundsModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />

      <WithdrawFundsModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />
    </>
  )
}
