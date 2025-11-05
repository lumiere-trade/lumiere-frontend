'use client'

import { WalletProvider } from '@/providers/WalletProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { WalletSync } from '@/components/wallet/WalletSync'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <WalletProvider>
        <WalletSync>
          {children}
        </WalletSync>
      </WalletProvider>
    </QueryProvider>
  )
}
