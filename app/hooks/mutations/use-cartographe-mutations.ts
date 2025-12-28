/**
 * Cartographe React Query Mutations
 * Backtesting mutations
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { runBacktest, BacktestRequest } from '@/lib/api/cartographe';

// ============================================================================
// BACKTEST MUTATIONS
// ============================================================================

/**
 * Run backtest mutation
 * Timeout: 60 seconds (handled by backend)
 */
export const useRunBacktest = () => {
  return useMutation({
    mutationFn: (request: BacktestRequest) => runBacktest(request),
    onSuccess: (data) => {
      toast.success('Backtest completed successfully!', {
        description: `Total Return: ${data.metrics.total_return_pct.toFixed(2)}% | Win Rate: ${data.metrics.win_rate.toFixed(1)}%`,
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to run backtest';
      toast.error('Backtest failed', {
        description: message,
      });
      console.error('Run backtest error:', error);
    },
  });
};
