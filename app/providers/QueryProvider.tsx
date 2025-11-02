'use client'

/**
 * React Query Provider.
 * Wraps the application with QueryClientProvider for data fetching/caching.
 * 
 * Configures global error handling for 401 Unauthorized errors,
 * automatically clearing auth state when token expires.
 */

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createQueryClient } from '@/lib/infrastructure/cache/query-client.config'
import { container } from '@/lib/infrastructure/di/container'

interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * Create QueryClient singleton with auth error handling.
 * 
 * When 401 error occurs, automatically clears auth token from storage
 * and apiClient, causing isAuthenticated() to return false and
 * disabling all auth-required queries.
 */
const queryClient = createQueryClient({
  onAuthError: () => {
    // Clear auth token from storage and apiClient
    container.clearAuthToken()
    // Queries will auto-disable because isAuthenticated() → false
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
