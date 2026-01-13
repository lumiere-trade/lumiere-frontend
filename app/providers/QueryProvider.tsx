'use client'

/**
 * React Query Provider
 * Wraps application with QueryClientProvider
 */

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createQueryClient } from '@/lib/infrastructure/cache/query-client.config'
import { removeToken, clearAuthToken } from '@/lib/api'

interface QueryProviderProps {
  children: React.ReactNode
}

const queryClient = createQueryClient({
  onAuthError: () => {
    removeToken()
    clearAuthToken()
  },
})

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
