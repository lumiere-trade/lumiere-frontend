"use client"

import { useState } from "react"
import { Button } from '@lumiere/shared/components/ui/button'
import { Card } from '@lumiere/shared/components/ui/card'
import { ScrollArea } from '@lumiere/shared/components/ui/scroll-area'
import { Ghost, Sun, Backpack, Gem, Zap, Circle, Shield, Wallet, Loader2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react"
import { AUTH_CONFIG } from "@/config/constants"
import { authApi } from "@/lib/api"
import { useLoginMutation } from "@/hooks/mutations/use-auth-mutations"
import { logger, LogCategory } from "@/lib/debug"
import { TermsDialog } from "./TermsDialog"
import type React from "react"
import bs58 from "bs58"

type WalletOption = {
  name: string
  icon: React.ComponentType<{ className?: string }>
  recent?: boolean
  installUrl?: string
}

const initialWallets: WalletOption[] = [
  { name: "Phantom", icon: Ghost, recent: true, installUrl: "https://phantom.app/download" },
  { name: "Solflare", icon: Sun, recent: false, installUrl: "https://solflare.com/download" },
  { name: "Backpack", icon: Backpack, recent: false },
  { name: "Binance Wallet", icon: Gem, recent: false },
]

const additionalWallets: WalletOption[] = [
  { name: "OKX Wallet", icon: Zap, recent: false },
  { name: "Coinbase Wallet", icon: Circle, recent: false },
  { name: "Trust Wallet", icon: Shield, recent: false },
  { name: "MetaMask", icon: Wallet, recent: false },
]

export function WalletConnectSection() {
  const [showAllWallets, setShowAllWallets] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connectedWalletAddress, setConnectedWalletAddress] = useState<string | null>(null)
  const [pendingSignature, setPendingSignature] = useState<string | null>(null)

  const solanaWallet = useSolanaWallet()
  const loginMutation = useLoginMutation()

  const isProcessing = loginMutation.isPending

  const displayedWallets = showAllWallets ? [...initialWallets, ...additionalWallets] : initialWallets

  const handleWalletClick = async (wallet: WalletOption) => {
    setSelectedWallet(wallet.name)
    setError(null)

    try {
      logger.info(LogCategory.WALLET, "Attempting to connect", { wallet: wallet.name })

      if (wallet.name === 'Phantom' && typeof window !== 'undefined') {
        const provider = (window as any).phantom?.solana

        if (!provider?.isPhantom) {
          if (wallet.installUrl) {
            window.open(wallet.installUrl, '_blank')
            setError('Please install Phantom wallet first')
          }
          return
        }

        logger.info(LogCategory.WALLET, 'Phantom provider found')

        if (provider.isConnected && provider.publicKey) {
          logger.info(LogCategory.WALLET, 'Phantom already connected')
          const walletAddress = provider.publicKey.toString()
          setConnectedWalletAddress(walletAddress)

          const walletAdapter = solanaWallet.wallets.find(
            w => w.adapter.name.toLowerCase() === 'phantom'
          )
          if (walletAdapter) {
            solanaWallet.select(walletAdapter.adapter.name)
          }

          await authenticateWithBackend(walletAddress, wallet.name)
          return
        }

        logger.info(LogCategory.WALLET, 'Requesting Phantom connection...')

        try {
          const resp = await provider.connect({ onlyIfTrusted: false })
          const walletAddress = resp.publicKey.toString()
          logger.info(LogCategory.WALLET, 'Phantom connected:', walletAddress)
          setConnectedWalletAddress(walletAddress)

          const walletAdapter = solanaWallet.wallets.find(
            w => w.adapter.name.toLowerCase() === 'phantom'
          )

          if (walletAdapter) {
            logger.info(LogCategory.WALLET, 'Syncing with wallet adapter...')
            solanaWallet.select(walletAdapter.adapter.name)

            let attempts = 0
            while (!solanaWallet.connected && attempts < 20) {
              await new Promise(resolve => setTimeout(resolve, 100))
              attempts++
            }
          }

          await authenticateWithBackend(walletAddress, wallet.name)

        } catch (connectError: any) {
          logger.error(LogCategory.WALLET, 'Phantom connection failed:', connectError)

          if (connectError.code === 4001 || connectError.message?.includes('User rejected')) {
            setError('Connection rejected. Please try again.')
          } else {
            setError(connectError.message || 'Failed to connect. Please try again.')
          }
          setSelectedWallet(null)
        }
      } else {
        const walletAdapter = solanaWallet.wallets.find(
          w => w.adapter.name.toLowerCase() === wallet.name.toLowerCase()
        )

        if (!walletAdapter) {
          if (wallet.installUrl) {
            window.open(wallet.installUrl, '_blank')
            setError(`Please install ${wallet.name} wallet first`)
          } else {
            setError(`${wallet.name} wallet is not available`)
          }
          return
        }

        logger.info(LogCategory.WALLET, 'Selecting adapter...')
        solanaWallet.select(walletAdapter.adapter.name)

        logger.info(LogCategory.WALLET, 'Waiting for wallet initialization...')
        let attempts = 0
        const maxAttempts = 30
        while (!solanaWallet.wallet && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        if (!solanaWallet.wallet) {
          throw new Error('Wallet failed to initialize. Please try again.')
        }

        logger.info(LogCategory.WALLET, 'Requesting connection...')
        await solanaWallet.connect()

        logger.info(LogCategory.WALLET, 'Connection successful')

        if (!solanaWallet.publicKey) {
          throw new Error('Failed to get wallet address')
        }

        const walletAddress = solanaWallet.publicKey.toString()
        setConnectedWalletAddress(walletAddress)

        await authenticateWithBackend(walletAddress, wallet.name)
      }
    } catch (error: any) {
      logger.error(LogCategory.WALLET, 'Connection error:', error)
      setError(error.message || 'Failed to connect wallet. Please try again.')
      setSelectedWallet(null)
    }
  }

  const authenticateWithBackend = async (walletAddress: string, walletName: string) => {
    try {
      logger.info(LogCategory.AUTH, 'Starting authentication...')

      const message = AUTH_CONFIG.MESSAGE
      const messageBytes = new TextEncoder().encode(message)

      logger.info(LogCategory.AUTH, 'Requesting signature...')

      let signatureBytes: Uint8Array

      if (walletName === 'Phantom' && typeof window !== 'undefined') {
        const provider = (window as any).phantom?.solana
        if (!provider) {
          throw new Error('Phantom provider not found')
        }

        const { signature } = await provider.signMessage(messageBytes, 'utf8')
        signatureBytes = signature
      } else {
        if (!solanaWallet.signMessage) {
          throw new Error('Wallet does not support message signing')
        }

        signatureBytes = await solanaWallet.signMessage(messageBytes)
      }

      const signatureBase58 = bs58.encode(signatureBytes)
      logger.info(LogCategory.AUTH, 'Signature obtained')

      logger.info(LogCategory.AUTH, 'Verifying wallet with backend...')
      const verifyResult = await authApi.verifyWallet(
        walletAddress,
        message,
        signatureBase58
      )

      logger.info(LogCategory.AUTH, 'Verification result:', verifyResult)

      if (!verifyResult.signature_valid) {
        throw new Error('Invalid signature. Please try again.')
      }

      if (!verifyResult.user_exists) {
        logger.info(LogCategory.AUTH, 'User does not exist, opening terms dialog')
        setPendingSignature(signatureBase58)
        setShowTermsDialog(true)
        return
      }

      logger.info(LogCategory.AUTH, 'User exists, logging in...')
      await loginMutation.mutateAsync({
        walletAddress,
        signature: signatureBase58,
        walletType: walletName
      })

      setSelectedWallet(null)

    } catch (error: any) {
      logger.error(LogCategory.AUTH, 'Authentication failed:', error)
      setError(error.message || 'Authentication failed. Please try again.')
      setSelectedWallet(null)

      if (solanaWallet.disconnect) {
        await solanaWallet.disconnect()
      }
    }
  }

  const handleCloseTermsDialog = () => {
    setShowTermsDialog(false)
    setSelectedWallet(null)
    setConnectedWalletAddress(null)
    setPendingSignature(null)

    if (solanaWallet.disconnect) {
      solanaWallet.disconnect()
    }
  }

  return (
    <>
      <Card className="w-full max-w-lg border-2 border-primary/30 shadow-2xl rounded-2xl p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-primary">Connect Wallet</h2>
            <p className="text-xs text-muted-foreground">
              Secure and simple. Lumiere is independently audited, with you in full control of your funds.
            </p>
          </div>

          <div className="h-[340px] overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {displayedWallets.map((wallet) => {
                  const IconComponent = wallet.icon
                  const isInstalled = solanaWallet.wallets.some(
                    w => w.adapter.name.toLowerCase() === wallet.name.toLowerCase()
                  )

                  return (
                    <button
                      key={wallet.name}
                      onClick={() => handleWalletClick(wallet)}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-card/50 border border-primary/20 hover:border-primary/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {wallet.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isInstalled && wallet.installUrl && (
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        )}
                        {wallet.recent && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
                            Recent
                          </span>
                        )}
                        {isProcessing && selectedWallet === wallet.name && (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          <button
            onClick={() => setShowAllWallets(!showAllWallets)}
            className="w-full flex items-center justify-center gap-2 py-3 text-primary hover:text-primary/80 transition-colors font-semibold"
            disabled={isProcessing}
          >
            {showAllWallets ? (
              <>
                <ChevronUp className="h-5 w-5" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-5 w-5" />
                <span>All Wallets</span>
              </>
            )}
          </button>

          {error && (
            <div className="text-sm text-red-500 text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}
        </div>
      </Card>

      {showTermsDialog && connectedWalletAddress && pendingSignature && selectedWallet && (
        <TermsDialog
          isOpen={showTermsDialog}
          onClose={handleCloseTermsDialog}
          walletAddress={connectedWalletAddress}
          signature={pendingSignature}
          walletType={selectedWallet}
        />
      )}
    </>
  )
}
