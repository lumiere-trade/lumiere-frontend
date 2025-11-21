'use client'

import { WalletProvider } from '@/providers/WalletProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { WalletSync } from '@/components/wallet/WalletSync'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryProvider>
        <WalletProvider>
          <WalletSync>
            {children}
          </WalletSync>
        </WalletProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
