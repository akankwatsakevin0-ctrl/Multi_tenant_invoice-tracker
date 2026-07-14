import { describe, it, expect } from 'vitest';
import { AppError, validateRequired, validateEmail, validateEnum } from '../../middleware/errorHandler';

describe('AppError', () => {
  it('creates error with message and status code', () => {
    const error = new AppError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  it('defaults to 500 status code', () => {
    const error = new AppError('Server error');
    expect(error.statusCode).toBe(500);
  });

  it('sets isOperational to false', () => {
    const error = new AppError('Unexpected', 500, false);
    expect(error.isOperational).toBe(false);
  });
});

describe('validateRequired', () => {
  it('passes for non-empty string', () => {
    expect(() => validateRequired('hello', 'name')).not.toThrow();
  });

  it('throws for undefined', () => {
    expect(() => validateRequired(undefined, 'name')).toThrow('name is required.');
  });

  it('throws for null', () => {
    expect(() => validateRequired(null, 'name')).toThrow('name is required.');
  });

  it('throws for empty string', () => {
    expect(() => validateRequired('', 'email')).toThrow('email is required.');
  });
});

describe('validateEmail', () => {
  it('passes for valid email', () => {
    expect(() => validateEmail('test@example.com')).not.toThrow();
  });

  it('throws for invalid email', () => {
    expect(() => validateEmail('not-an-email')).toThrow('Invalid email format.');
  });

  it('throws for empty string', () => {
    expect(() => validateEmail('')).toThrow('Invalid email format.');
  });
});

describe('validateEnum', () => {
  const statuses = ['draft', 'sent', 'paid'] as const;

  it('returns the value for valid input', () => {
    expect(validateEnum('draft', statuses, 'status')).toBe('draft');
  });

  it('throws for invalid input', () => {
    expect(() => validateEnum('invalid', statuses, 'status')).toThrow(
      'status must be one of: draft, sent, paid'
    );
  });
});
