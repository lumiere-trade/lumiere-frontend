/**
 * Chronicler React Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { getTokens } from '@/lib/api/chronicler';

const CHRONICLER_QUERY_KEYS = {
  tokens: () => ['chronicler', 'tokens'] as const,
};

export const useTokensQuery = () => {
  return useQuery({
    queryKey: CHRONICLER_QUERY_KEYS.tokens(),
    queryFn: getTokens,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
