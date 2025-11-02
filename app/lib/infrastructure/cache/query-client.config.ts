/**
 * React Query Client Configuration.
 * 
 * Factory function for creating QueryClient with proper error handling.
 * Uses dependency injection pattern to avoid circular dependencies.
 */

import { QueryClient } from '@tanstack/react-query'
import { NetworkError } from '@/lib/domain/errors/network.error'

export interface QueryClientOptions {
  /**
   * Callback invoked when 401 Unauthorized error occurs.
   * Used to clear auth state and logout user.
   */
  onAuthError?: () => void
}

/**
 * Create QueryClient with optional error handling callback.
 * 
 * @param options - Configuration options including auth error handler
 * @returns Configured QueryClient instance
 */
export function createQueryClient(options?: QueryClientOptions): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on 401 (authentication) or 403 (forbidden)
          if (error instanceof NetworkError) {
            if (error.statusCode === 401 || error.statusCode === 403) {
              return false
            }
          }
          // Retry other errors up to 3 times
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        
        // Global error handler
        throwOnError: (error) => {
          // Handle 401 errors globally
          if (error instanceof NetworkError && error.statusCode === 401) {
            // Invoke auth error callback (logout)
            options?.onAuthError?.()
            // Don't throw to error boundary, let query handle it
            return false
          }
          // Let other errors propagate to error boundary
          return true
        },
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry on client errors (4xx)
          if (error instanceof NetworkError) {
            if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
              return false
            }
          }
          // Retry server errors once
          return failureCount < 1
        },
        retryDelay: 1000,
        
        // Global error handler for mutations
        throwOnError: (error) => {
          // Handle 401 errors globally
          if (error instanceof NetworkError && error.statusCode === 401) {
            options?.onAuthError?.()
            return false
          }
          return true
        },
      },
    },
  })
}

/**
 * Create QueryClient for testing with no retries and no caching.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
