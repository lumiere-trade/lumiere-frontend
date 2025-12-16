/**
 * Prophet API Client - SSE Streaming
 * CRITICAL: Frontend does NOT detect TSDL or calculate progress.
 * Prophet sends explicit events - frontend just visualizes them.
 */

const PROPHET_URL = process.env.NEXT_PUBLIC_PROPHET_URL || 'http://localhost:9081'

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
  state?: string;
  history?: ProphetMessage[];
  strategy_context?: StrategyContext;
}

export interface ProphetHealthResponse {
  status: string;
  service: string;
  version: string;
  mode?: string;
  compact_syntax_loaded?: boolean;
  platform_docs_tool?: string;
  embeddings_service?: string;
  redis_cache?: string;
}

export interface ParamMetadata {
  type: 'int' | 'float' | 'enum' | 'string' | 'boolean';
  min?: number;
  max?: number;
  default?: any;
  step?: number;
  unit?: string;
  values?: string[];
  description?: string;
}

export interface FieldParam extends ParamMetadata {
  value: any;
}

export interface IndicatorParam {
  name: string;
  type: string;
  display_name?: string;
  category?: string;
  description?: string;
  params: Record<string, FieldParam>;
}

export interface StrategyParameters {
  indicators: IndicatorParam[];
  asset: Record<string, FieldParam>;
  exit_conditions: Record<string, FieldParam>;
  risk_management: Record<string, FieldParam>;
  position_sizing: Record<string, FieldParam>;
  entry_description?: string | null;
  exit_description?: string | null;
}

export interface ProgressEvent {
  stage: 'generating_strategy' | 'validating_strategy' | 'wrapping_up';
  message: string;
  percent: number;
}

export interface StrategyGeneratedEvent {
  tsdl_code: string;
  parameters: StrategyParameters;
  strategy_id: string;
  strategy_name: string;
}

export interface RegenerateTSDLRequest {
  current_tsdl: string;
  updated_values: Record<string, any>;
}

export interface RegenerateTSDLResponse {
  tsdl_code: string;
}

export type SSEEvent =
  | { type: 'metadata'; data: { conversation_id: string; state: string } }
  | { type: 'token'; data: { token: string } }
  | { type: 'progress'; data: ProgressEvent }
  | { type: 'strategy_generated'; data: StrategyGeneratedEvent }
  | { type: 'done'; data: { conversation_id: string; state: string; message_count?: number } }
  | { type: 'error'; data: { error: string } };

/**
 * Send chat message to Prophet AI with SSE streaming.
 * Prophet controls ALL strategy detection and progress - frontend just listens.
 */
export async function sendChatMessageStream(
  request: ProphetChatRequest,
  onToken: (token: string) => void,
  onProgress: (progress: ProgressEvent) => void,
  onStrategyGenerated: (strategy: StrategyGeneratedEvent) => void,
  onComplete: (fullMessage: string, conversationId: string, state: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${PROPHET_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
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
    let state = '';

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
            state = eventData.state;
          } else if (eventType === 'token') {
            fullMessage += eventData.token;
            onToken(eventData.token);
          } else if (eventType === 'progress') {
            onProgress(eventData as ProgressEvent);
          } else if (eventType === 'strategy_generated') {
            onStrategyGenerated(eventData as StrategyGeneratedEvent);
          } else if (eventType === 'done') {
            state = eventData.state || state;
            onComplete(fullMessage, conversationId, state);
          } else if (eventType === 'error') {
            onError(new Error(eventData.error));
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

export async function getProphetHealth(): Promise<ProphetHealthResponse> {
  const response = await fetch(`${PROPHET_URL}/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Prophet health check failed: ${response.status}`);
  }

  return response.json();
}

export async function regenerateTSDL(
  request: RegenerateTSDLRequest
): Promise<RegenerateTSDLResponse> {
  const response = await fetch(`${PROPHET_URL}/regenerate-tsdl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to regenerate TSDL: ${response.statusText}`);
  }

  return response.json();
}

export const prophetApi = {
  sendChatMessageStream,
  getProphetHealth,
  regenerateTSDL,
};
