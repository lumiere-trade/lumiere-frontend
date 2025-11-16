/**
 * Prophet API Client with SSE streaming support
 */

const PROPHET_URL = process.env.NEXT_PUBLIC_PROPHET_URL || 'http://localhost:9081'

export interface ProphetMessage {
  role: string;
  content: string;
}

export interface ProphetChatRequest {
  message: string;
  conversation_id?: string;
  user_id?: string;
  state?: string;  // NEW: current conversation state
  history?: ProphetMessage[];  // NEW: previous messages
}

export interface ProphetHealthResponse {
  status: string;
  service: string;
  version: string;
  mode?: string;
  tsdl_syntax_loaded?: boolean;
  tsdl_version?: string;
  plugins_loaded?: string[];
  plugin_count?: number;
  tsdl_documentation_size?: number;
  estimated_tokens?: number;
}

/**
 * SSE Event types
 */
export type SSEEvent =
  | { type: 'metadata'; data: { conversation_id: string; state: string } }
  | { type: 'token'; data: { token: string } }
  | { type: 'done'; data: { conversation_id: string; state: string; message_count?: number } }
  | { type: 'error'; data: { error: string } };

/**
 * Send chat message to Prophet AI with SSE streaming
 * Throttles token updates for smoother visual display
 */
export async function sendChatMessageStream(
  request: ProphetChatRequest,
  onToken: (token: string) => void,
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

    // Throttling for smoother display
    let pendingTokens: string[] = [];
    let isProcessingTokens = false;

    const processPendingTokens = () => {
      if (pendingTokens.length === 0 || isProcessingTokens) return;

      isProcessingTokens = true;
      const batchSize = 5; // Characters per update
      const delay = 15; // ms between updates

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
          } else if (eventType === 'done') {
            // Update state from done event
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

export const prophetApi = {
  sendChatMessageStream,
  getProphetHealth,
};
