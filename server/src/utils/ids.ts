import { randomBytes } from 'crypto';

export function generateReferralCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}

export function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export function generateTransactionId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(4).toString('hex').toUpperCase();
  return `TXN-${ts}-${rand}`;
}

export function generateTicketNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(2).toString('hex').toUpperCase();
  return `TKT-${ts}-${rand}`;
}

export function generateUsername(fullName: string): string {
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12) || 'user';
  const suffix = randomBytes(2).toString('hex');
  return `${base}${suffix}`;
}
