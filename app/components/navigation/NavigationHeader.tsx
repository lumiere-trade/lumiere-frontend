"use client"

import { Button } from '@lumiere/shared/components/ui/button'
import Link from "next/link"
import { useState, useEffect } from "react"
import { Wallet, ArrowDownToLine, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletPanel } from "@/components/wallet/WalletPanel"
import { DepositFundsModal } from "@/components/wallet/DepositFundsModal"
import { UserProfileModal } from "@/components/navigation/UserProfileModal"
import { ThemeToggle } from "@/components/theme-toggle"
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
      <header className="border-b border-primary/20 bg-background z-20 relative h-[64px]">
        <div className="flex items-center justify-between px-4 md:px-6 h-full">
          <Link href="/dashboard" className="transition-all hover:brightness-110">
            <div className="text-2xl md:text-3xl font-bold tracking-wider text-primary leading-none whitespace-nowrap">
              LUMIÈRE
            </div>
          </Link>

          <nav className="flex items-center gap-3">
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

            <UserProfileModal />

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

            <ThemeToggle />

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
