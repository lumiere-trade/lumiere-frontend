/**
 * HTTP Client for Architect API
 * Separate client for Architect microservice
 */

const ARCHITECT_URL = process.env.NEXT_PUBLIC_ARCHITECT_URL || 'http://localhost:9082'
const DEFAULT_TIMEOUT = 10000

export class ArchitectApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ArchitectApiError'
  }
}

export class ArchitectTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArchitectTimeoutError'
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
      throw new ArchitectTimeoutError(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

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

    throw new ArchitectApiError(errorMessage, response.status, errorCode)
  }

  return response.json()
}

export async function architectRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const url = `${ARCHITECT_URL}${endpoint}`
  const headers = getHeaders(options.headers)

  const response = await fetchWithTimeout(
    url,
    { ...options, headers },
    timeout
  )

  return handleResponse<T>(response)
}

export async function get<T>(endpoint: string): Promise<T> {
  return architectRequest<T>(endpoint, { method: 'GET' })
}

export async function post<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return architectRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function patch<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return architectRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function del<T>(endpoint: string): Promise<T> {
  return architectRequest<T>(endpoint, { method: 'DELETE' })
}

export default {
  get,
  post,
  patch,
  del,
}
