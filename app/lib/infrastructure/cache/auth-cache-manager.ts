/**
 * Auth Cache Manager
 * Manages cache invalidation for auth-dependent queries
 */
import { QueryClient } from '@tanstack/react-query'
import { AUTH_QUERY_KEYS } from '@/hooks/queries/use-auth-queries'
import { ESCROW_QUERY_KEYS } from '@/hooks/queries/use-escrow-queries'

const AUTH_DEPENDENT_QUERIES = [
  AUTH_QUERY_KEYS.currentUser,
  AUTH_QUERY_KEYS.compliance,
  ESCROW_QUERY_KEYS.balance,
]

export function invalidateAuthDependentQueries(queryClient: QueryClient): void {
  AUTH_DEPENDENT_QUERIES.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey })
  })
}

export function invalidateAllAuthQueries(queryClient: QueryClient): void {
  queryClient.clear()
}
