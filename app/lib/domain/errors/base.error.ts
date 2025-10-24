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
