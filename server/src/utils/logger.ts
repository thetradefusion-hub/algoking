import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'authorization',
      'req.headers.authorization',
      'panNumber',
      'accountNumber',
      'body.password',
      'body.confirmPassword',
    ],
    censor: '[REDACTED]',
  },
});
