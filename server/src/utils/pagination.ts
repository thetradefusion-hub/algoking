import type { Request } from 'express';

export function getPagination(req: Request, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(req.query.limit) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
