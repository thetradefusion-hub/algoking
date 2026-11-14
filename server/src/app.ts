import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes, {
  bankRouter,
  kycRouter,
  notificationRouter,
  orderRouter,
  planRouter,
  paymentMethodRouter,
  publicContentRouter,
  rechargeRouter,
  referralRouter,
  supportRouter,
  walletRouter,
  withdrawalRouter,
} from './routes/userRoutes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  const allowedOrigins = [
    env.CLIENT_URL,
    ...String(env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ];

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Local Vite may bind 5173/5174/… — allow any localhost origin in development
        if (
          env.NODE_ENV !== 'production' &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
        ) {
          return callback(null, true);
        }
        if (env.ALLOW_VERCEL_PREVIEWS && /\.vercel\.app$/i.test(new URL(origin).hostname)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== 'test',
    })
  );

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Private uploads are NOT statically public — serve only via authorized routes later
  app.use('/private-uploads', (_req, res) => {
    res.status(403).json({ success: false, message: 'Forbidden' });
  });

  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      service: 'AlgoKing API',
      mode: env.PLATFORM_MODE,
      timestamp: new Date().toISOString(),
    });
  });

  const api = express.Router();
  api.use('/auth', authRoutes);
  api.use('/users', userRoutes);
  api.use('/plans', planRouter);
  api.use('/orders', orderRouter);
  api.use('/wallets', walletRouter);
  api.use('/recharges', rechargeRouter);
  api.use('/withdrawals', withdrawalRouter);
  api.use('/referrals', referralRouter);
  api.use('/kyc', kycRouter);
  api.use('/bank-accounts', bankRouter);
  api.use('/payment-methods', paymentMethodRouter);
  api.use('/notifications', notificationRouter);
  api.use('/support', supportRouter);
  api.use('/admin', adminRoutes);
  api.use('/', publicContentRouter);

  // Payment webhook placeholder (signature verification required in LIVE)
  api.post('/payments/webhook', express.json(), async (req, res) => {
    // Demo adapter: ignore unverified live webhooks
    logger.info({ bodyKeys: Object.keys(req.body || {}) }, 'Payment webhook received');
    res.json({ received: true, mode: env.PLATFORM_MODE });
  });

  app.use('/api/v1', api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  // Ensure upload dir reference exists for future multer use
  void path.resolve(env.UPLOAD_DIR);

  return app;
}
