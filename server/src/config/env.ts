import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().optional().default(''),
  ALLOW_VERCEL_PREVIEWS: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  COOKIE_SAME_SITE: z.enum(['lax', 'none', 'strict']).optional().default('lax'),
  PLATFORM_MODE: z.enum(['DEMO', 'LIVE']).default('DEMO'),
  ENCRYPTION_KEY: z.string().min(32),
  UPLOAD_DIR: z.string().default('uploads'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),
  PAYMENT_GATEWAY: z.enum(['demo', 'razorpay']).default('demo'),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().optional(),
  SUPER_ADMIN_MOBILE: z.string().optional(),
  SUPER_ADMIN_NAME: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  if (process.env.SKIP_ENV_VALIDATION !== 'true') {
    // Allow bootstrap scripts that only need partial env when explicitly skipped
    throw new Error('Invalid environment variables. Copy server/.env.example to server/.env');
  }
}

export const env = (parsed.success
  ? parsed.data
  : ({
      NODE_ENV: 'development',
      PORT: 5000,
      MONGODB_URI: process.env.MONGODB_URI || '',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
      JWT_ACCESS_EXPIRES: '15m',
      JWT_REFRESH_EXPIRES: '7d',
      CLIENT_URL: 'http://localhost:5173',
      ALLOWED_ORIGINS: '',
      ALLOW_VERCEL_PREVIEWS: false,
      COOKIE_SECURE: false,
      COOKIE_SAME_SITE: 'lax',
      PLATFORM_MODE: 'DEMO',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
      UPLOAD_DIR: 'uploads',
      RATE_LIMIT_WINDOW_MS: 900000,
      RATE_LIMIT_MAX: 200,
      AUTH_RATE_LIMIT_MAX: 20,
      PAYMENT_GATEWAY: 'demo',
      RAZORPAY_KEY_ID: '',
      RAZORPAY_KEY_SECRET: '',
      RAZORPAY_WEBHOOK_SECRET: '',
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
      LOG_LEVEL: 'info',
    } as z.infer<typeof envSchema>));

export const isDemoMode = () => env.PLATFORM_MODE === 'DEMO';
