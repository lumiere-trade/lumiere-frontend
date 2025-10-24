import { DomainError } from './base.error'

/**
 * Base authentication error
 */
export class AuthenticationError extends DomainError {
  constructor(message: string = 'Authentication failed', code?: string) {
    super(message, code || 'AUTH_ERROR')
  }

  public getUserMessage(): string {
    return 'Unable to authenticate. Please try again.'
  }
}

/**
 * Invalid signature error
 */
export class InvalidSignatureError extends AuthenticationError {
  constructor(message: string = 'Invalid wallet signature') {
    super(message, 'INVALID_SIGNATURE')
  }

  public getUserMessage(): string {
    return 'Signature verification failed. Please sign the message again.'
  }
}

/**
 * User not found error
 */
export class UserNotFoundError extends AuthenticationError {
  constructor(message: string = 'User not found') {
    super(message, 'USER_NOT_FOUND')
  }

  public getUserMessage(): string {
    return 'Account not found. Please create an account first.'
  }
}

/**
 * Wallet connection error
 */
export class WalletConnectionError extends AuthenticationError {
  constructor(message: string = 'Failed to connect wallet') {
    super(message, 'WALLET_CONNECTION_ERROR')
  }

  public getUserMessage(): string {
    return 'Unable to connect to wallet. Please make sure your wallet is unlocked.'
  }
}

/**
 * Session expired error
 */
export class SessionExpiredError extends AuthenticationError {
  constructor(message: string = 'Session expired') {
    super(message, 'SESSION_EXPIRED')
  }

  public getUserMessage(): string {
    return 'Your session has expired. Please log in again.'
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AuthenticationError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED')
  }

  public getUserMessage(): string {
    return 'You do not have permission to access this resource.'
  }
}
