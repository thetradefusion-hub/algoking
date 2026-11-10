import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY.slice(0, 32), 'utf8');
}

/** Encrypt sensitive strings (PAN, bank account). Returns iv:tag:ciphertext hex. */
export function encryptSensitive(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSensitive(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Invalid encrypted payload');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function maskPan(pan: string): string {
  if (pan.length < 4) return '****';
  return `${pan.slice(0, 2)}******${pan.slice(-2)}`;
}

export function maskAccountNumber(account: string): string {
  if (account.length <= 4) return '****';
  return `${'*'.repeat(Math.max(account.length - 4, 4))}${account.slice(-4)}`;
}

export function last4(value: string): string {
  return value.slice(-4);
}
