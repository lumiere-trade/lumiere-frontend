/**
 * Chronicler API Client
 * Market data service for Solana tokens
 */

import { get } from './client';
import { logger, LogCategory } from '@/lib/debug';

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo_uri: string;
}

export type TokensResponse = Token[];

const CHRONICLER_PREFIX = '/api/chronicler';

export const getTokens = async (): Promise<TokensResponse> => {
  logger.debug(LogCategory.API, 'Fetching available tokens');
  
  try {
    const result = await get(`${CHRONICLER_PREFIX}/tokens`);
    logger.info(LogCategory.API, 'Tokens fetched', { count: result.length });
    return result;
  } catch (error) {
    logger.error(LogCategory.API, 'Failed to fetch tokens', { error });
    throw error;
  }
};
