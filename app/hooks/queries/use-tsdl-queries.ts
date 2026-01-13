/**
 * TSDL Query Hooks
 * React Query hooks for TSDL metadata and data extraction endpoints
 */

import { useQuery } from '@tanstack/react-query'
import {
  getIndicatorMetadata,
  getOperatorMetadata,
  getParameterMetadata,
  extractName,
  extractDescription,
  extractIndicators,
  extractEntryRules,
  extractExitRules,
  extractParameters,
  extractSymbol,
  extractTimeframe,
  IndicatorMetadata,
  OperatorMetadata,
  ParameterMetadata,
} from '@/lib/api/tsdl'
import { StrategyJSON } from '@/lib/api/prophet'

// ============================================================================
// METADATA QUERIES (Specs for UI)
// ============================================================================

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

// ============================================================================
// DATA EXTRACTION QUERIES (Extract from TSDL JSON)
// ============================================================================

/**
 * Extract strategy name from TSDL JSON
 * TSDL is Single Source of Truth - it knows how to parse its format
 */
export function useExtractName(tsdlJson: StrategyJSON | null) {
  return useQuery<string, Error>({
    queryKey: ['tsdl', 'extract', 'name', tsdlJson],
    queryFn: () => extractName(tsdlJson!),
    enabled: !!tsdlJson,
    staleTime: Infinity, // Never refetch - TSDL JSON is immutable
  })
}

/**
 * Extract strategy description from TSDL JSON
 */
export function useExtractDescription(tsdlJson: StrategyJSON | null) {
  return useQuery<string, Error>({
    queryKey: ['tsdl', 'extract', 'description', tsdlJson],
    queryFn: () => extractDescription(tsdlJson!),
    enabled: !!tsdlJson,
    staleTime: Infinity,
  })
}

/**
 * Extract indicators from TSDL JSON
 */
export function useExtractIndicators(tsdlJson: StrategyJSON | null) {
  return useQuery<string[], Error>({
    queryKey: ['tsdl', 'extract', 'indicators', tsdlJson],
    queryFn: () => extractIndicators(tsdlJson!),
    enabled: !!tsdlJson,
    staleTime: Infinity,
  })
}

/**
 * Extract entry rules from TSDL JSON
 */
export function useExtractEntryRules(tsdlJson: StrategyJSON | null) {
  return useQuery<{ entry_rules: string[]; entry_logic: string }, Error>({
    queryKey: ['tsdl', 'extract', 'entry_rules', tsdlJson],
    queryFn: () => extractEntryRules(tsdlJson!),
    enabled: !!tsdlJson,
    staleTime: Infinity,
  })
}

/**
 * Extract exit rules from TSDL JSON
 */
export function useExtractExitRules(tsdlJson: StrategyJSON | null) {
  return useQuery<{ exit_rules: string[]; exit_logic: string }, Error>({
    queryKey: ['tsdl', 'extract', 'exit_rules', tsdlJson],
    queryFn: () => extractExitRules(tsdlJson!),
    enabled: !!tsdlJson,
    staleTime: Infinity,
  })
}

/**
 * Extract risk parameters from TSDL JSON
 */
export function useExtractParameters(tsdlJson: StrategyJSON | null) {
  return useQuery <
    { stop_loss: number; take_profit: number | null; trailing_stop: number | null },
    Error
  >({
    queryKey: ['tsdl', 'extract', 'parameters', tsdlJson],
    queryFn: () => extractParameters(tsdlJson!),
    enabled: !!tsdlJson,
    staleTime: Infinity,
  })
}

/**
 * Extract symbol from TSDL JSON
 */
export function useExtractSymbol(tsdlJson: StrategyJSON | null) {
  return useQuery<string, Error>({
    queryKey: ['tsdl', 'extract', 'symbol', tsdlJson],
    queryFn: () => extractSymbol(tsdlJson!),
    enabled: !!tsdlJson,
    staleTime: Infinity,
  })
}

/**
 * Extract timeframe from TSDL JSON
 */
export function useExtractTimeframe(tsdlJson: StrategyJSON | null) {
  return useQuery<string, Error>({
    queryKey: ['tsdl', 'extract', 'timeframe', tsdlJson],
    queryFn: () => extractTimeframe(tsdlJson!),
    enabled: !!tsdlJson,
    staleTime: Infinity,
  })
}
