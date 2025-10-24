/**
 * Base class for network-related errors
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'NetworkError'
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

/**
 * Request timeout error
 */
export class TimeoutError extends NetworkError {
  constructor(message: string = 'Request timeout') {
    super(message)
    this.name = 'TimeoutError'
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

/**
 * Network connection error (offline, DNS failure, etc)
 */
export class ConnectionError extends NetworkError {
  constructor(message: string = 'Connection error', originalError?: Error) {
    super(message, undefined, originalError)
    this.name = 'ConnectionError'
    Object.setPrototypeOf(this, ConnectionError.prototype)
  }
}

/**
 * Server error (5xx)
 */
export class ServerError extends NetworkError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode)
    this.name = 'ServerError'
    Object.setPrototypeOf(this, ServerError.prototype)
  }
}

/**
 * Client error (4xx)
 */
export class ClientError extends NetworkError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode)
    this.name = 'ClientError'
    Object.setPrototypeOf(this, ClientError.prototype)
  }
}
