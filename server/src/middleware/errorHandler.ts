// =============================================================================
// Global Error Handling Middleware
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// ---------------------------------------------------------------------------
// Custom application error class
// ---------------------------------------------------------------------------

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ---------------------------------------------------------------------------
// 404 handler — resource not found
// ---------------------------------------------------------------------------

export function notFound(req: Request, res: Response<ApiResponse>): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// ---------------------------------------------------------------------------
// Global error handler — catches all errors thrown in route handlers
// ---------------------------------------------------------------------------

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  // Default to 500 internal server error
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  // Log unexpected errors in development
  if (!(err instanceof AppError) || !err.isOperational) {
    console.error('❌ Unexpected error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

// ---------------------------------------------------------------------------
// Validation helper — throws AppError on invalid input
// ---------------------------------------------------------------------------

export function validateRequired(
  value: unknown,
  fieldName: string
): asserts value is string {
  if (value === undefined || value === null || value === '') {
    throw new AppError(`${fieldName} is required.`, 400);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email format.', 400);
  }
}

export function validateEnum<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string
): T {
  if (!allowedValues.includes(value as T)) {
    throw new AppError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      400
    );
  }
  return value as T;
}
