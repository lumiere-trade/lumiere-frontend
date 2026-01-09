/**
 * TSDL Query Hooks
 * React Query hooks for TSDL metadata endpoints
 */

import { useQuery } from '@tanstack/react-query'
import {
  getIndicatorMetadata,
  getOperatorMetadata,
  getParameterMetadata,
  IndicatorMetadata,
  OperatorMetadata,
  ParameterMetadata,
} from '@/lib/api/tsdl'

/**
 * Query hook for indicator metadata
 * Provides specifications for all available indicators
 */
export function useIndicatorMetadataQuery() {
  return useQuery<IndicatorMetadata, Error>({
    queryKey: ['tsdl', 'metadata', 'indicators'],
    queryFn: getIndicatorMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour (metadata rarely changes)
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

/**
 * Query hook for operator metadata
 * Provides specifications for logical operators
 */
export function useOperatorMetadataQuery() {
  return useQuery<OperatorMetadata, Error>({
    queryKey: ['tsdl', 'metadata', 'operators'],
    queryFn: getOperatorMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

/**
 * Query hook for risk parameter metadata
 * Provides specifications for stop_loss, take_profit, trailing_stop
 */
export function useParameterMetadataQuery() {
  return useQuery<ParameterMetadata, Error>({
    queryKey: ['tsdl', 'metadata', 'parameters'],
    queryFn: getParameterMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}
