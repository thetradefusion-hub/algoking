import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(env.MONGODB_URI);
  logger.info({ host: conn.connection.host, db: conn.connection.name }, 'MongoDB connected');
  return conn;
}
