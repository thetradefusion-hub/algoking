import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, type UserRole } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export interface AuthUser {
  id: string;
  role: UserRole;
  permissions: string[];
  email: string;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface AccessPayload {
  sub: string;
  role: UserRole;
  type: 'access';
}

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) throw ApiError.unauthorized('Access token required');

  let payload: AccessPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  if (payload.type !== 'access') throw ApiError.unauthorized('Invalid token type');

  const user = await User.findById(payload.sub).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('User not found');
  if (user.status === 'blocked') throw ApiError.forbidden('Account is blocked');
  if (user.status === 'inactive') throw ApiError.forbidden('Account is inactive');

  req.user = {
    id: user._id.toString(),
    role: user.role,
    permissions: user.permissions || [],
    email: user.email,
    fullName: user.fullName,
  };
  next();
});

export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
    if (payload.type === 'access') {
      const user = await User.findById(payload.sub);
      if (user && user.status === 'active') {
        req.user = {
          id: user._id.toString(),
          role: user.role,
          permissions: user.permissions || [],
          email: user.email,
          fullName: user.fullName,
        };
      }
    }
  } catch {
    // ignore optional auth failures
  }
  next();
});

const ADMIN_ROLES: UserRole[] = [
  'admin',
  'super_admin',
  'finance_manager',
  'support_manager',
  'kyc_manager',
];

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient role'));
    next();
  };
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());
  if (!ADMIN_ROLES.includes(req.user.role)) return next(ApiError.forbidden('Admin access required'));
  next();
}

export function requirePermission(...perms: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === 'super_admin') return next();
    if (req.user.role === 'admin' && perms.length === 0) return next();
    const has = perms.some((p) => req.user!.permissions.includes(p) || req.user!.permissions.includes('*'));
    if (!has && req.user.role !== 'admin') {
      return next(ApiError.forbidden('Missing permission'));
    }
    // admins with empty permission list get broad access; fine-grained roles need explicit perms
    if (req.user.role === 'admin') return next();
    if (!has) return next(ApiError.forbidden('Missing permission'));
    next();
  };
}
