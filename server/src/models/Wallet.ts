import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type WalletType = 'main' | 'income' | 'referral';

export interface IWallet extends Document {
  userId: Types.ObjectId;
  walletType: WalletType;
  balance: number;
  totalCredited: number;
  totalDebited: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    walletType: { type: String, enum: ['main', 'income', 'referral'], required: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
    totalCredited: { type: Number, required: true, default: 0, min: 0 },
    totalDebited: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

walletSchema.index({ userId: 1, walletType: 1 }, { unique: true });

export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);
