/**
 * HTTP Client for Lumiere API
 * Simple function-based approach without classes
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

let authToken: string | null = null

function initializeAuthToken(): void {
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('lumiere_auth_token')
      if (token) {
        authToken = token
        console.log('[CLIENT-DEBUG] Auth token initialized from localStorage:', token.substring(0, 20))
      } else {
        console.log('[CLIENT-DEBUG] No token found in localStorage')
      }
    } catch (error) {
      console.error('Failed to initialize auth token:', error)
    }
  }
}

initializeAuthToken()

export function setAuthToken(token: string): void {
  authToken = token
  console.log('[CLIENT-DEBUG] setAuthToken called, token set to:', token.substring(0, 20))
}

export function clearAuthToken(): void {
  authToken = null
  console.log('[CLIENT-DEBUG] clearAuthToken called')
}

export function getAuthToken(): string | null {
  return authToken
}

function getHeaders(additionalHeaders?: HeadersInit): HeadersInit {
  console.log('[CLIENT-DEBUG] getHeaders called, authToken:', authToken ? authToken.substring(0, 20) + '...' : 'NULL')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
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

  return response.json()
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
