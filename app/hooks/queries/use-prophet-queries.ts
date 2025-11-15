/**
 * Prophet Query Hooks
 * React Query hooks for Prophet AI chat
 */

import { useQuery } from '@tanstack/react-query';
import { getProphetHealth, ProphetHealthResponse } from '@/lib/api/prophet';

export const PROPHET_QUERY_KEYS = {
  health: ['prophet', 'health'] as const,
};

/**
 * Query Prophet health status
 */
export function useProphetHealthQuery() {
  return useQuery<ProphetHealthResponse>({
    queryKey: PROPHET_QUERY_KEYS.health,
    queryFn: getProphetHealth,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}
