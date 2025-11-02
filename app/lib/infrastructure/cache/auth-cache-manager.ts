/**
 * Auth Cache Manager (Infrastructure Layer).
 * 
 * Manages cache invalidation for auth-dependent queries.
 * Single source of truth for which queries depend on authentication state.
 */

import { QueryClient } from '@tanstack/react-query'
import { AUTH_QUERY_KEYS } from '@/lib/presentation/hooks/queries/use-auth-queries'
import { ESCROW_QUERY_KEYS } from '@/lib/presentation/hooks/queries/use-escrow-queries'

/**
 * List of query keys that depend on authentication state.
 * 
 * These queries will be invalidated when:
 * - User logs in
 * - User creates account
 * - Auth token is refreshed
 */
const AUTH_DEPENDENT_QUERIES = [
  AUTH_QUERY_KEYS.currentUser,
  AUTH_QUERY_KEYS.compliance,
  ESCROW_QUERY_KEYS.balance,
  ESCROW_QUERY_KEYS.walletBalance,
  // Future: Add more auth-dependent queries here
  // STRATEGY_QUERY_KEYS.userStrategies,
  // PORTFOLIO_QUERY_KEYS.positions,
] as const

/**
 * Invalidate all queries that depend on authentication state.
 * 
 * Call this after successful login or account creation to ensure
 * all auth-dependent data is refetched with the new token.
 * 
 * @param queryClient - React Query client instance
 */
export function invalidateAuthDependentQueries(queryClient: QueryClient): void {
  AUTH_DEPENDENT_QUERIES.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey })
  })
}

/**
 * Invalidate all queries except auth-independent ones.
 * 
 * Useful for logout or auth token expiration.
 * 
 * @param queryClient - React Query client instance
 */
export function invalidateAllAuthQueries(queryClient: QueryClient): void {
  // Clear all queries on logout
  queryClient.clear()
}
