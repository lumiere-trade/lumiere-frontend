/**
 * Prophet API Client with SSE streaming support
 * OPTIMIZED: Uses Redis cache, sends minimal data
 * NEW: Supports strategy_context for editing workflows
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
  strategy_context?: StrategyContext; // NEW!
}

export interface ProphetHealthResponse {
  status: string;
  service: string;
  version: string;
  mode?: string;
  tsdl_syntax_loaded?: boolean;
  redis_cache?: string; // NEW: Redis status
  tsdl_version?: string;
  plugins_loaded?: string[];
  plugin_count?: number;
  tsdl_documentation_size?: number;
  estimated_tokens?: number;
}

/**
 * Parameter metadata types from Prophet
 */
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

export interface StrategyMetadata {
  indicators: IndicatorParam[];
  asset: Record<string, FieldParam>;
  exit_conditions: Record<string, FieldParam>;
  risk_management: Record<string, FieldParam>;
  position_sizing: Record<string, FieldParam>;
  entry_description?: string | null;
  exit_description?: string | null;
}

/**
 * Regenerate TSDL Request/Response types
 */
export interface RegenerateTSDLRequest {
  current_tsdl: string;
  updated_values: Record<string, any>;
}

export interface RegenerateTSDLResponse {
  tsdl_code: string;
}

/**
 * SSE Event types
 */
export type SSEEvent =
  | { type: 'metadata'; data: { conversation_id: string; state: string } }
  | { type: 'token'; data: { token: string } }
  | { type: 'strategy_metadata'; data: StrategyMetadata }
  | { type: 'done'; data: { conversation_id: string; state: string; message_count?: number } }
  | { type: 'error'; data: { error: string } };

/**
 * Send chat message to Prophet AI with SSE streaming
 * Throttles token updates for smoother visual display
 * NEW: Supports optional strategy_context for editing workflows
 */
export async function sendChatMessageStream(
  request: ProphetChatRequest,
  onToken: (token: string) => void,
  onComplete: (fullMessage: string, conversationId: string, state: string) => void,
  onError: (error: Error) => void,
  onStrategyMetadata?: (metadata: StrategyMetadata) => void
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

    // Throttling for smoother display
    let pendingTokens: string[] = [];
    let isProcessingTokens = false;

    const processPendingTokens = () => {
      if (pendingTokens.length === 0 || isProcessingTokens) return;

      isProcessingTokens = true;
      const batchSize = 5;
      const delay = 15;

      const processNextBatch = () => {
        if (pendingTokens.length === 0) {
          isProcessingTokens = false;
          return;
        }

        const batch = pendingTokens.splice(0, batchSize);
        onToken(batch.join(''));

        if (pendingTokens.length > 0) {
          setTimeout(processNextBatch, delay);
        } else {
          isProcessingTokens = false;
        }
      };

      processNextBatch();
    };

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
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
            pendingTokens.push(eventData.token);
            processPendingTokens();
          } else if (eventType === 'strategy_metadata') {
            // Handle strategy metadata from Prophet
            if (onStrategyMetadata) {
              onStrategyMetadata(eventData as StrategyMetadata);
            }
          } else if (eventType === 'done') {
            state = eventData.state || state;

            // Wait for pending tokens to finish
            const waitForCompletion = () => {
              if (isProcessingTokens || pendingTokens.length > 0) {
                setTimeout(waitForCompletion, 50);
              } else {
                onComplete(fullMessage, conversationId, state);
              }
            };
            waitForCompletion();
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

/**
 * Get Prophet health status
 */
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

/**
 * Regenerate TSDL code with updated parameter values
 * Uses LLM to intelligently update variable names and references
 */
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
