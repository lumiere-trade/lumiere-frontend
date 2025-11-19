/**
 * HTTP Client for Lumiere API
 * Token read directly from localStorage on every request
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'
const DEFAULT_TIMEOUT = 10000

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('lumiere_auth_token')
  } catch (error) {
    console.error('Failed to read auth token:', error)
    return null
  }
}

export function setAuthToken(_token: string): void {
  // No-op: token managed directly via localStorage
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('lumiere_auth_token')
    } catch (error) {
      console.error('Failed to clear auth token:', error)
    }
  }
}

function getHeaders(additionalHeaders?: HeadersInit): HeadersInit {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (additionalHeaders) {
    Object.assign(headers, additionalHeaders)
  }

  return headers
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    let errorCode: string | undefined

    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
      errorCode = errorData.code
    } catch {
      errorMessage = response.statusText || errorMessage
    }

    throw new ApiError(errorMessage, response.status, errorCode)
  }

  // Handle 204 No Content - no body to parse
  if (response.status === 204) {
    return undefined as T
  }

  // Check if response has content
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }

  // For non-JSON responses with content, return as-is
  return undefined as T
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  const headers = getHeaders(options.headers)

  const response = await fetchWithTimeout(
    url,
    { ...options, headers },
    timeout
  )

  return handleResponse<T>(response)
}

export async function get<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' })
}

export async function post<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function patch<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function put<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function del<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' })
}
