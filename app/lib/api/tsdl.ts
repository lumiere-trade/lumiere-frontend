/**
 * TSDL API Client
 * Metadata endpoints + Data extraction endpoints (via Pourtier Gateway)
 *
 * IMPORTANT: Frontend should NEVER parse TSDL JSON directly.
 * TSDL is Single Source of Truth - it knows how to parse its own format.
 */

import { getAuthToken } from './client'
import { StrategyJSON } from './prophet'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'

// ============================================================================
// METADATA TYPES (Specs for UI)
// ============================================================================

export interface IndicatorMetadata {
  [key: string]: {
    description: string;
    parameters: {
      [param: string]: {
        type: string;
        default: number;
        min?: number;
        max?: number;
        description: string;
      };
    };
    output: string;
    category: string;
    examples: string[];
  };
}

export interface OperatorMetadata {
  [key: string]: {
    description: string;
    usage: string;
    examples: string[];
  };
}

export interface ParameterMetadata {
  stop_loss: {
    type: string;
    min: number;
    max: number;
    default: number;
    step: number;
    unit: string;
    required: boolean;
    description: string;
    examples: number[];
  };
  take_profit: {
    type: string;
    min: number;
    max: number;
    default: number | null;
    step: number;
    unit: string;
    required: boolean;
    description: string;
    examples: number[];
  };
  trailing_stop: {
    type: string;
    min: number;
    max: number;
    default: number | null;
    step: number;
    unit: string;
    required: boolean;
    description: string;
    examples: number[];
  };
  rules: {
    exit_strategy: string;
    validation: string;
  };
}

// ============================================================================
// DATA EXTRACTION TYPES (Extracted from TSDL JSON)
// ============================================================================

export interface ExtractNameResponse {
  name: string;
}

export interface ExtractDescriptionResponse {
  description: string;
}

export interface ExtractIndicatorsResponse {
  indicators: string[];
}

export interface ExtractEntryRulesResponse {
  entry_rules: string[];
  entry_logic: string;
}

export interface ExtractExitRulesResponse {
  exit_rules: string[];
  exit_logic: string;
}

export interface ExtractParametersResponse {
  stop_loss: number;
  take_profit: number | null;
  trailing_stop: number | null;
}

export interface ExtractSymbolResponse {
  symbol: string;
}

export interface ExtractTimeframeResponse {
  timeframe: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// ============================================================================
// METADATA ENDPOINTS (Specs for UI)
// ============================================================================

/**
 * Get indicator metadata from TSDL service
 * Returns specifications for all available indicators
 */
export async function getIndicatorMetadata(): Promise<IndicatorMetadata> {
  const response = await fetch(`${API_URL}/api/tsdl/metadata/indicators`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch indicator metadata: ${response.status}`);
  }

  return response.json();
}

/**
 * Get operator metadata from TSDL service
 * Returns specifications for logical operators (AND, OR, etc.)
 */
export async function getOperatorMetadata(): Promise<OperatorMetadata> {
  const response = await fetch(`${API_URL}/api/tsdl/metadata/operators`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch operator metadata: ${response.status}`);
  }

  return response.json();
}

/**
 * Get risk parameter metadata from TSDL service
 * Returns specifications for stop_loss, take_profit, trailing_stop
 */
export async function getParameterMetadata(): Promise<ParameterMetadata> {
  const response = await fetch(`${API_URL}/api/tsdl/metadata/parameters`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch parameter metadata: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// DATA EXTRACTION ENDPOINTS (Parse TSDL JSON)
// ============================================================================

/**
 * Extract name from TSDL JSON
 * TSDL knows how to parse its own format - don't parse directly!
 */
export async function extractName(tsdlJson: StrategyJSON): Promise<string> {
  const response = await fetch(`${API_URL}/api/tsdl/data/name`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ tsdl_json: tsdlJson }),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract name: ${response.status}`);
  }

  const data: ExtractNameResponse = await response.json();
  return data.name;
}

/**
 * Extract description from TSDL JSON
 */
export async function extractDescription(tsdlJson: StrategyJSON): Promise<string> {
  const response = await fetch(`${API_URL}/api/tsdl/data/description`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ tsdl_json: tsdlJson }),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract description: ${response.status}`);
  }

  const data: ExtractDescriptionResponse = await response.json();
  return data.description;
}

/**
 * Extract indicators from TSDL JSON
 */
export async function extractIndicators(tsdlJson: StrategyJSON): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/tsdl/data/indicators`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ tsdl_json: tsdlJson }),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract indicators: ${response.status}`);
  }

  const data: ExtractIndicatorsResponse = await response.json();
  return data.indicators;
}

/**
 * Extract entry rules from TSDL JSON
 */
export async function extractEntryRules(
  tsdlJson: StrategyJSON
): Promise<{ entry_rules: string[]; entry_logic: string }> {
  const response = await fetch(`${API_URL}/api/tsdl/data/entry_rules`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ tsdl_json: tsdlJson }),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract entry rules: ${response.status}`);
  }

  const data: ExtractEntryRulesResponse = await response.json();
  return { entry_rules: data.entry_rules, entry_logic: data.entry_logic };
}

/**
 * Extract exit rules from TSDL JSON
 */
export async function extractExitRules(
  tsdlJson: StrategyJSON
): Promise<{ exit_rules: string[]; exit_logic: string }> {
  const response = await fetch(`${API_URL}/api/tsdl/data/exit_rules`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ tsdl_json: tsdlJson }),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract exit rules: ${response.status}`);
  }

  const data: ExtractExitRulesResponse = await response.json();
  return { exit_rules: data.exit_rules, exit_logic: data.exit_logic };
}

/**
 * Extract risk parameters from TSDL JSON
 */
export async function extractParameters(
  tsdlJson: StrategyJSON
): Promise<{ stop_loss: number; take_profit: number | null; trailing_stop: number | null }> {
  const response = await fetch(`${API_URL}/api/tsdl/data/parameters`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ tsdl_json: tsdlJson }),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract parameters: ${response.status}`);
  }

  const data: ExtractParametersResponse = await response.json();
  return {
    stop_loss: data.stop_loss,
    take_profit: data.take_profit,
    trailing_stop: data.trailing_stop,
  };
}

/**
 * Extract symbol from TSDL JSON
 */
export async function extractSymbol(tsdlJson: StrategyJSON): Promise<string> {
  const response = await fetch(`${API_URL}/api/tsdl/data/symbol`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ tsdl_json: tsdlJson }),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract symbol: ${response.status}`);
  }

  const data: ExtractSymbolResponse = await response.json();
  return data.symbol;
}

/**
 * Extract timeframe from TSDL JSON
 */
export async function extractTimeframe(tsdlJson: StrategyJSON): Promise<string> {
  const response = await fetch(`${API_URL}/api/tsdl/data/timeframe`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ tsdl_json: tsdlJson }),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract timeframe: ${response.status}`);
  }

  const data: ExtractTimeframeResponse = await response.json();
  return data.timeframe;
}

/**
 * Extract ALL data from TSDL JSON in one batch request (RECOMMENDED)
 * 
 * This is the most efficient way to load strategy data:
 * - One API call instead of 8 separate calls
 * - TSDL validates the JSON structure
 * - Returns clean, validated StrategyJSON
 * 
 * Use this for initial strategy loading in useStrategyLoader.
 */
export async function extractAll(tsdlJson: StrategyJSON): Promise<StrategyJSON> {
  const response = await fetch(`${API_URL}/api/tsdl/data/all`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ tsdl_json: tsdlJson }),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract all data: ${response.status}`);
  }

  // TSDL validates and returns clean StrategyJSON
  return response.json();
}

/**
 * Parse TSDL code string to StrategyJSON
 * Helper function - still need to extract fields via TSDL API after parsing
 */
export function parseTSDLCode(tsdlCode: string): StrategyJSON {
  try {
    return JSON.parse(tsdlCode) as StrategyJSON;
  } catch (error) {
    throw new Error(`Failed to parse TSDL code: ${error}`);
  }
}

export const tsdlApi = {
  // Metadata (specs)
  getIndicatorMetadata,
  getOperatorMetadata,
  getParameterMetadata,

  // Data extraction
  extractName,
  extractDescription,
  extractIndicators,
  extractEntryRules,
  extractExitRules,
  extractParameters,
  extractSymbol,
  extractTimeframe,
  extractAll,

  // Helper
  parseTSDLCode,
};
