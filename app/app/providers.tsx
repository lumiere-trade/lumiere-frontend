"use client"

import { QueryProvider } from "@/providers/QueryProvider"
import { WalletProvider } from "@/providers/WalletProvider"
import { StrategyProvider } from "@/contexts/StrategyContext"
import { WalletSync } from "@/components/wallet/WalletSync"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryProvider>
        <WalletProvider>
          <WalletSync>
            <StrategyProvider>
              {children}
            </StrategyProvider>
          </WalletSync>
        </WalletProvider>
      </QueryProvider>
      <Toaster />
    </ThemeProvider>
  )
}
