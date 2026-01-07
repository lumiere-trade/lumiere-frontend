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
    staleTime: 60 * 1000, // 60 seconds
    refetchInterval: 30 * 1000, // Background refetch every 30s
    refetchOnMount: false, // Don't refetch on mount (prevents flicker)
    refetchOnWindowFocus: false, // Don't refetch on focus
    retry: 2,
  });
}
