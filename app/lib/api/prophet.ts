/**
 * Prophet API Client with SSE streaming support
 */

const PROPHET_URL = process.env.NEXT_PUBLIC_PROPHET_URL || 'http://localhost:9081'

export interface ProphetChatRequest {
  message: string;
  conversation_id?: string;
  user_id?: string;
}

export interface ProphetChatResponse {
  message: string;
  conversation_id: string;
  state: string;
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
  | { type: 'done'; data: { conversation_id: string; state: string } }
  | { type: 'error'; data: { error: string } };

/**
 * Send chat message to Prophet AI with SSE streaming
 */
export async function sendChatMessageStream(
  request: ProphetChatRequest,
  onEvent: (event: SSEEvent) => void,
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
      
      // Process complete SSE messages
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete message in buffer

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
            onEvent({ type: 'metadata', data: eventData });
          } else if (eventType === 'token') {
            fullMessage += eventData.token;
            onEvent({ type: 'token', data: eventData });
          } else if (eventType === 'done') {
            onEvent({ type: 'done', data: eventData });
            onComplete(fullMessage, conversationId, state);
          } else if (eventType === 'error') {
            onEvent({ type: 'error', data: eventData });
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
