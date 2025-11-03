/**
 * React Query Client Configuration
 * Factory function for creating QueryClient with error handling
 */
import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/client'

export interface QueryClientOptions {
  onAuthError?: () => void
}

export function createQueryClient(options?: QueryClientOptions): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            if (error.statusCode === 401 || error.statusCode === 403) {
              return false
            }
          }
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,

        throwOnError: (error) => {
          if (error instanceof ApiError && error.statusCode === 401) {
            options?.onAuthError?.()
            return false
          }
          return true
        },
      },
      mutations: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
              return false
            }
          }
          return failureCount < 1
        },
        retryDelay: 1000,

        throwOnError: (error) => {
          if (error instanceof ApiError && error.statusCode === 401) {
            options?.onAuthError?.()
            return false
          }
          return true
        },
      },
    },
  })
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}
