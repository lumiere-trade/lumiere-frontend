/**
 * Escrow Domain Errors
 * 
 * Business logic errors related to escrow operations.
 */

import { BaseError, ErrorCode } from './base.error'

export class EscrowNotInitializedError extends BaseError {
  constructor(message: string = 'Escrow account not initialized') {
    super(message, ErrorCode.ESCROW_NOT_INITIALIZED)
    this.name = 'EscrowNotInitializedError'
  }
}

export class InsufficientEscrowBalanceError extends BaseError {
  constructor(
    required: number,
    available: number,
    message?: string
  ) {
    super(
      message || `Insufficient escrow balance. Required: ${required} USDC, Available: ${available} USDC`,
      ErrorCode.INSUFFICIENT_BALANCE
    )
    this.name = 'InsufficientEscrowBalanceError'
  }
}

export class InvalidDepositAmountError extends BaseError {
  constructor(message: string = 'Invalid deposit amount') {
    super(message, ErrorCode.VALIDATION_ERROR)
    this.name = 'InvalidDepositAmountError'
  }
}

export class InvalidWithdrawAmountError extends BaseError {
  constructor(message: string = 'Invalid withdrawal amount') {
    super(message, ErrorCode.VALIDATION_ERROR)
    this.name = 'InvalidWithdrawAmountError'
  }
}

export class EscrowTransactionFailedError extends BaseError {
  constructor(message: string = 'Escrow transaction failed') {
    super(message, ErrorCode.TRANSACTION_FAILED)
    this.name = 'EscrowTransactionFailedError'
  }
}

export class EscrowAlreadyInitializedError extends BaseError {
  constructor(message: string = 'Escrow account already initialized') {
    super(message, ErrorCode.ALREADY_EXISTS)
    this.name = 'EscrowAlreadyInitializedError'
  }
}
