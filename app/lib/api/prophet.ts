/**
 * Prophet API Client - SSE Streaming (via Pourtier Gateway)
 * All requests go through Pourtier with JWT authentication
 * Updated for MVP with simplified strategy schema
 */

import { getAuthToken } from './client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'

export interface ProphetMessage {
  role: string;
  content: string;
}

export interface StrategyContext {
  strategy_id: string;
  current_tsdl: string;
  strategy_name?: string;
  last_updated?: string;
}

export interface ProphetChatRequest {
  message: string;
  conversation_id?: string;
  user_id?: string;
  history?: ProphetMessage[];
  strategy_context?: StrategyContext;
}

export interface ProphetHealthResponse {
  status: string;
  service: string;
  version: string;
  mode?: string;
  strategy_schema_loaded?: boolean;
  platform_docs_tool?: string;
  embeddings_service?: string;
  redis_cache?: string;
}

// MVP Strategy Schema - Only 12 fields
export interface StrategyJSON {
  // Core metadata (4 fields)
  name: string;
  description: string;
  symbol: string;
  timeframe: string;

  // Indicator-based strategy fields (5 fields)
  indicators: string[];
  entry_rules: string[];
  entry_logic: string;
  exit_rules: string[];
  exit_logic: string;

  // Risk management (3 fields)
  stop_loss: number;
  take_profit: number | null;
  trailing_stop: number | null;
}

export interface ProgressEvent {
  stage: 'generating_strategy' | 'compiling_strategy' | 'error';
  message: string;
  percent: number;
}

export interface StrategyGeneratedEvent {
  strategy_json: StrategyJSON;
  python_code: string;
  strategy_id: string;
  strategy_name: string;
  strategy_class_name: string;
  metadata?: any;
}

export type SSEEvent =
  | { type: 'metadata'; data: { conversation_id: string } }
  | { type: 'token'; data: { token: string } }
  | { type: 'progress'; data: ProgressEvent }
  | { type: 'strategy_generated'; data: StrategyGeneratedEvent }
  | { type: 'done'; data: { conversation_id: string; message_count?: number } }
  | { type: 'error'; data: { error: string } };

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
 * Send chat message to Prophet AI with SSE streaming.
 * Routes through Pourtier API Gateway for authentication.
 */
export async function sendChatMessageStream(
  request: ProphetChatRequest,
  onToken: (token: string) => void,
  onProgress: (progress: ProgressEvent) => void,
  onStrategyGenerated: (strategy: StrategyGeneratedEvent) => void,
  onComplete: (fullMessage: string, conversationId: string) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/prophet/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Prophet API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullMessage = '';
    let conversationId = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        const eventMatch = line.match(/^event: (.+)$/m);
        const dataMatch = line.match(/^data: (.+)$/m);

        if (eventMatch && dataMatch) {
          const eventType = eventMatch[1];
          const eventData = JSON.parse(dataMatch[1]);

          if (eventType === 'metadata') {
            conversationId = eventData.conversation_id;
          } else if (eventType === 'token') {
            fullMessage += eventData.token;
            onToken(eventData.token);
          } else if (eventType === 'progress') {
            onProgress(eventData as ProgressEvent);
          } else if (eventType === 'done') {
            onComplete(fullMessage, conversationId);
          } else if (eventType === 'strategy_generated') {
            onStrategyGenerated(eventData as StrategyGeneratedEvent);
          } else if (eventType === 'error') {
            onError(new Error(eventData.error));
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[Prophet] Stream aborted by user');
      return;
    }
    onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

export async function getProphetHealth(): Promise<ProphetHealthResponse> {
  const response = await fetch(`${API_URL}/api/prophet/health`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Prophet health check failed: ${response.status}`);
  }

  return response.json();
}

export const prophetApi = {
  sendChatMessageStream,
  getProphetHealth,
};
