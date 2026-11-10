import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound('API endpoint not found'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten(),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Mongoose duplicate key
  if (typeof err === 'object' && err && 'code' in err && (err as { code: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value',
      code: 'CONFLICT',
    });
  }

  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : (err as Error)?.message,
    code: 'INTERNAL',
  });
}
