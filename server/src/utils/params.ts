import type { Request } from 'express';
import { ApiError } from './apiError.js';

export function param(req: Request, name: string): string {
  const value = req.params[name];
  const resolved = Array.isArray(value) ? value[0] : value;
  if (!resolved) throw ApiError.badRequest(`Missing route parameter: ${name}`);
  return resolved;
}
