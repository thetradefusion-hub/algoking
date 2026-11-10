import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import * as authService from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

const sameSite = env.COOKIE_SAME_SITE || 'lax';
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE || sameSite === 'none',
  sameSite: sameSite as 'lax' | 'none' | 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, mobile, password, referralCode } = req.body;
  const result = await authService.registerUser({
    fullName,
    email,
    mobile,
    password,
    referralCode: referralCode || undefined,
  });
  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
  return sendSuccess(
    res,
    { user: result.user, accessToken: result.accessToken },
    'Registration successful',
    201
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const result = await authService.loginUser(identifier, password);
  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
  return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Refresh token required', code: 'UNAUTHORIZED' });
  }
  const result = await authService.refreshSession(token);
  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
  return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) await authService.logoutUser(req.user.id);
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  return sendSuccess(res, null, 'Logged out');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  return sendSuccess(res, { user, platformMode: env.PLATFORM_MODE });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, result, result.message || 'If the account exists, reset instructions were sent');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  return sendSuccess(res, null, 'Password reset successful');
});
