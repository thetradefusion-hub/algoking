import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function idempotencyKey(prefix = 'op') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
