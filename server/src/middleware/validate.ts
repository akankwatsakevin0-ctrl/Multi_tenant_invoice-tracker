import { Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AuthenticatedRequest, ApiResponse } from '../types';

export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const firstError = result.error.issues[0];
      res.status(400).json({
        success: false,
        error: firstError.message,
      });
      return;
    }
    req[source] = result.data;
    next();
  };
}
