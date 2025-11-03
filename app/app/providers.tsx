'use client'

import { WalletProvider } from '@/providers/WalletProvider'
import { QueryProvider } from '@/providers/QueryProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    </QueryProvider>
  )
}
