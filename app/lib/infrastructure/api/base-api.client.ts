import { NetworkError, TimeoutError } from '@/lib/domain/errors/network.error'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'
const DEFAULT_TIMEOUT = 10000 // 10 seconds

export interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

export class BaseApiClient {
  private baseUrl: string
  private authToken: string | null = null

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null
  }

  /**
   * Get headers with auth token if available
   */
  private getHeaders(additionalHeaders?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    // Merge with additional headers
    if (additionalHeaders) {
      Object.assign(headers, additionalHeaders)
    }

    return headers
  }

  /**
   * Make HTTP request with timeout and retry support
   */
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      timeout = DEFAULT_TIMEOUT,
      retries = 0,
      retryDelay = 1000,
      ...fetchOptions
    } = config

    let lastError: Error

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.fetchWithTimeout<T>(endpoint, fetchOptions, timeout)
      } catch (error) {
        lastError = error as Error

        // Don't retry on client errors (4xx)
        if (error instanceof NetworkError && error.statusCode >= 400 && error.statusCode < 500) {
          throw error
        }

        // If this was the last attempt, throw
        if (attempt === retries) {
          throw lastError
        }

        // Wait before retrying (exponential backoff)
        await this.sleep(retryDelay * Math.pow(2, attempt))
      }
    }

    throw lastError!
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout<T>(
    endpoint: string,
    options: RequestInit,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: this.getHeaders(options.headers),
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw await this.handleErrorResponse(response)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request timeout after ${timeout}ms`)
      }

      throw error
    }
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<Error> {
    let errorMessage = `HTTP ${response.status}`

    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch {
      // If can't parse JSON, use status text
      errorMessage = response.statusText || errorMessage
    }

    return new NetworkError(errorMessage, response.status)
  }

  /**
   * Helper to sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }
}

// Export singleton instance
export const apiClient = new BaseApiClient()
