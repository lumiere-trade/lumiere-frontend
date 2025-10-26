/**
 * Base domain error class
 * All domain errors should extend this class
 */
export abstract class DomainError extends Error {
  public readonly timestamp: Date
  public readonly code?: string
  
  constructor(message: string, code?: string) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()
    this.code = code
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    
    Object.setPrototypeOf(this, new.target.prototype)
  }
  
  /**
   * Get user-friendly error message
   */
  public getUserMessage(): string {
    return this.message
  }
  
  /**
   * Convert error to JSON for logging
   */
  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    }
  }
}

/**
 * Alias for DomainError for consistency across codebase
 */
export abstract class BaseError extends DomainError {}

/**
 * Standard error codes used across the application
 */
export enum ErrorCode {
  // Authentication errors (1000-1999)
  AUTHENTICATION_FAILED = 'AUTH_1000',
  INVALID_SIGNATURE = 'AUTH_1001',
  USER_NOT_FOUND = 'AUTH_1002',
  TOKEN_EXPIRED = 'AUTH_1003',
  INVALID_TOKEN = 'AUTH_1004',
  
  // Wallet errors (2000-2999)
  WALLET_NOT_CONNECTED = 'WALLET_2000',
  SIGNATURE_REJECTED = 'WALLET_2001',
  WALLET_NOT_SUPPORTED = 'WALLET_2002',
  
  // Network errors (3000-3999)
  NETWORK_ERROR = 'NETWORK_3000',
  TIMEOUT_ERROR = 'NETWORK_3001',
  API_ERROR = 'NETWORK_3002',
  
  // Validation errors (4000-4999)
  VALIDATION_ERROR = 'VALIDATION_4000',
  INVALID_INPUT = 'VALIDATION_4001',
  
  // Escrow errors (5000-5999)
  ESCROW_NOT_INITIALIZED = 'ESCROW_5000',
  INSUFFICIENT_BALANCE = 'ESCROW_5001',
  TRANSACTION_FAILED = 'ESCROW_5002',
  ALREADY_EXISTS = 'ESCROW_5003',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_9999',
}
