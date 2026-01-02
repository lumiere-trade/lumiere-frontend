/**
 * Unified Chronicler Hook
 * Provides convenient access to Chronicler data
 */

import { useTokensQuery } from './queries/use-chronicler-queries';

export const useChronicler = () => {
  const { data: tokens = [], isLoading, error, refetch } = useTokensQuery();

  return {
    tokens,
    tokensCount: tokens.length,
    isLoading,
    error,
    refetch,
  };
};
