import type { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, unknown>
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  message = 'Success'
) {
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  });
}
