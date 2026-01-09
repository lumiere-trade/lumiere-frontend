/**
 * TSDL API Client - Metadata endpoints (via Pourtier Gateway)
 * Provides metadata for indicators, operators, and risk parameters
 */

import { getAuthToken } from './client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'

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

export const tsdlApi = {
  getIndicatorMetadata,
  getOperatorMetadata,
  getParameterMetadata,
};
