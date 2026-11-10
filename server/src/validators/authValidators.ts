import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(2).max(120),
    email: z.string().email(),
    mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
    referralCode: z.string().trim().max(20).optional().or(z.literal('')),
    acceptTerms: z.boolean(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.acceptTerms === true, {
    message: 'You must accept Terms & Conditions',
    path: ['acceptTerms'],
  });

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
