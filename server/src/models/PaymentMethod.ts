import mongoose, { Schema, type Document } from 'mongoose';

export type PaymentMethodCode = 'bep20' | 'trc20' | 'inr_upi' | 'inr_bank';
export type PaymentMethodKind = 'crypto' | 'fiat';

export interface IPaymentMethod extends Document {
  code: PaymentMethodCode;
  name: string;
  kind: PaymentMethodKind;
  network?: string;
  currency: string;
  iconUrl: string;
  /** Public image URL for deposit QR / barcode (USDT / UPI). */
  qrCodeUrl?: string;
  depositEnabled: boolean;
  withdrawEnabled: boolean;
  depositAddress?: string;
  upiId?: string;
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  depositInstructions?: string;
  withdrawInstructions?: string;
  minDeposit: number;
  maxDeposit: number;
  minWithdraw: number;
  maxWithdraw: number;
  depositFee: number;
  withdrawFee: number;
  sortOrder: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    code: {
      type: String,
      enum: ['bep20', 'trc20', 'inr_upi', 'inr_bank'],
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    kind: { type: String, enum: ['crypto', 'fiat'], required: true },
    network: { type: String },
    currency: { type: String, required: true },
    iconUrl: { type: String, required: true },
    qrCodeUrl: { type: String, default: '' },
    depositEnabled: { type: Boolean, default: true },
    withdrawEnabled: { type: Boolean, default: true },
    depositAddress: { type: String },
    upiId: { type: String },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    depositInstructions: { type: String },
    withdrawInstructions: { type: String },
    minDeposit: { type: Number, default: 100 },
    maxDeposit: { type: Number, default: 500000 },
    minWithdraw: { type: Number, default: 500 },
    maxWithdraw: { type: Number, default: 200000 },
    depositFee: { type: Number, default: 0 },
    withdrawFee: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

export const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);
