import mongoose, { Schema, type Document, type Types } from 'mongoose';
import type { WalletType } from './Wallet.js';

export type LedgerType = 'credit' | 'debit';
export type LedgerStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface IWalletTransaction extends Document {
  transactionId: string;
  userId: Types.ObjectId;
  walletId: Types.ObjectId;
  walletType: WalletType;
  type: LedgerType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: Types.ObjectId | string;
  description: string;
  status: LedgerStatus;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    transactionId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    walletType: { type: String, enum: ['main', 'income', 'referral'], required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    referenceType: { type: String },
    referenceId: { type: Schema.Types.Mixed },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'reversed'],
      default: 'completed',
      index: true,
    },
    idempotencyKey: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ walletType: 1, createdAt: -1 });
walletTransactionSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

export const WalletTransaction = mongoose.model<IWalletTransaction>(
  'WalletTransaction',
  walletTransactionSchema
);
