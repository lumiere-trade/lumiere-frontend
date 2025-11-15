/**
 * Prophet API Client
 * Handles communication with Prophet AI for strategy creation
 */

// Prophet URL - proxied through nginx at /prophet
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
 * Send chat message to Prophet AI
 */
export async function sendChatMessage(
  request: ProphetChatRequest
): Promise<ProphetChatResponse> {
  const response = await fetch(`${PROPHET_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Prophet API error: ${response.status}`);
  }

  return response.json();
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
 * Prophet API exports
 */
export const prophetApi = {
  sendChatMessage,
  getProphetHealth,
};
