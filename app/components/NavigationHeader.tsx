"use client"

import { Button } from '@lumiere/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@lumiere/shared/components/ui/dialog'
import Link from "next/link"
import { useState, useEffect } from "react"
import { Settings, Copy, Wallet, ArrowDownToLine, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletPanel } from "@/components/wallet/WalletPanel"
import { DepositFundsModal } from "@/components/wallet/DepositFundsModal"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"

interface NavigationHeaderProps {
  currentPage?: "dashboard" | "create"
}

export function NavigationHeader({ currentPage }: NavigationHeaderProps) {
  const log = useLogger('NavigationHeader', LogCategory.COMPONENT)
  const { user, logout } = useAuth()
  const { disconnect } = useWallet()
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)

  const walletAddress = user?.walletAddress ? `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}` : "Not connected"
  const walletType = user?.walletType || "Unknown"

  useEffect(() => {
    if (user) {
      log.info('User loaded', { 
        walletAddress: user.walletAddress.substring(0, 8) + '...',
        walletType: user.walletType
      })
    }
  }, [user])

  const handleDepositClick = () => {
    log.info('Deposit button clicked')
    setIsDepositModalOpen(true)
  }

  const handleDepositClose = () => {
    log.info('Deposit modal closed')
    setIsDepositModalOpen(false)
  }

  const handleCopyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress)
      log.info('Wallet address copied to clipboard')
    }
  }

  const handleDisconnect = async () => {
    log.info('Disconnect initiated')
    log.time('disconnect')
    
    try {
      await disconnect()
      logout()
      log.info('Disconnect successful')
    } catch (error) {
      log.error('Disconnect failed', error)
      logout()
    } finally {
      log.timeEnd('disconnect')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background shrink-0">
        <div className="mx-auto flex items-center justify-between pl-4 md:pl-6 pr-4 md:pr-6 py-3 md:py-4">
          <Link href="/" className="flex flex-col gap-0.5 transition-all hover:brightness-110">
            <div className="text-xl md:text-2xl font-bold tracking-wider text-primary leading-none">
              LUMIERE
            </div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground tracking-wide leading-none">
              Blind to emotion, guided by algorithm
            </p>
          </Link>

          <nav className="container mx-auto flex items-center justify-end gap-3">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-6 md:px-8 font-semibold"
              >
                DASHBOARD
              </Button>
            </Link>
            <Link href="/create">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-6 md:px-8 font-semibold"
              >
                CREATE
              </Button>
            </Link>

            <Button
              variant="default"
              size="lg"
              className="rounded-full px-4 md:px-6 font-semibold gap-2"
              onClick={handleDepositClick}
            >
              <ArrowDownToLine className="h-4 w-4" />
              DEPOSIT
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => log.info('Settings dialog opened')}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card border border-primary/30 rounded-2xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-primary">User Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Wallet Address</label>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3">
                      <span className="flex-1 font-mono text-sm">{user?.walletAddress || "Not connected"}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCopyAddress}
                        disabled={!user?.walletAddress}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Wallet Type</label>
                    <div className="rounded-lg border border-border bg-background p-3 capitalize">{walletType}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Member Since</label>
                    <div className="rounded-lg border border-border bg-background p-3">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "Not available"}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <WalletPanel
              trigger={
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full font-semibold gap-2"
                >
                  <Wallet className="h-5 w-5" />
                  {walletAddress}
                </Button>
              }
            />

            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={handleDisconnect}
              title="Disconnect Wallet"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </header>

      <DepositFundsModal
        isOpen={isDepositModalOpen}
        onClose={handleDepositClose}
      />
    </>
  )
}
