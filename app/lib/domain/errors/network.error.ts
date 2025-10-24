import { DomainError } from './base.error'

/**
 * Base class for network-related errors
 */
export class NetworkError extends DomainError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message, `NETWORK_ERROR_${statusCode || 'UNKNOWN'}`)
  }

  public getUserMessage(): string {
    if (this.statusCode && this.statusCode >= 500) {
      return 'Server error. Please try again later.'
    }
    if (this.statusCode && this.statusCode >= 400) {
      return 'Request failed. Please check your input and try again.'
    }
    return 'Network error. Please check your connection and try again.'
  }
}

/**
 * Request timeout error
 */
export class TimeoutError extends NetworkError {
  constructor(message: string = 'Request timeout') {
    super(message)
    this.code = 'TIMEOUT_ERROR'
  }

  public getUserMessage(): string {
    return 'Request timed out. Please try again.'
  }
}

/**
 * Network connection error (offline, DNS failure, etc)
 */
export class ConnectionError extends NetworkError {
  constructor(message: string = 'Connection error', originalError?: Error) {
    super(message, undefined, originalError)
    this.code = 'CONNECTION_ERROR'
  }

  public getUserMessage(): string {
    return 'Unable to connect. Please check your internet connection.'
  }
}

/**
 * Server error (5xx)
 */
export class ServerError extends NetworkError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode)
    this.code = 'SERVER_ERROR'
  }

  public getUserMessage(): string {
    return 'Server error. Our team has been notified. Please try again later.'
  }
}

/**
 * Client error (4xx)
 */
export class ClientError extends NetworkError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode)
    this.code = 'CLIENT_ERROR'
  }

  public getUserMessage(): string {
    if (this.statusCode === 400) {
      return 'Invalid request. Please check your input.'
    }
    if (this.statusCode === 401) {
      return 'Unauthorized. Please log in again.'
    }
    if (this.statusCode === 403) {
      return 'Access denied. You do not have permission for this action.'
    }
    if (this.statusCode === 404) {
      return 'Resource not found.'
    }
    return 'Request failed. Please try again.'
  }
}
