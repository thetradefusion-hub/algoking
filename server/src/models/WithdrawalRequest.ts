import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type WithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'failed';

export type WithdrawalWalletType = 'main' | 'income' | 'referral';

export interface IWithdrawalRequest extends Document {
  userId: Types.ObjectId;
  walletType: WithdrawalWalletType;
  amount: number;
  fee: number;
  netAmount: number;
  bankAccountId?: Types.ObjectId;
  paymentMethodId?: Types.ObjectId;
  methodCode?: string;
  network?: string;
  currency?: string;
  destinationAddress?: string;
  destinationUpi?: string;
  destinationBankSnapshot?: Record<string, unknown>;
  status: WithdrawalStatus;
  payoutReference?: string;
  reviewedBy?: Types.ObjectId;
  rejectionReason?: string;
  internalNote?: string;
  reserveTransactionId?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    walletType: {
      type: String,
      enum: ['main', 'income', 'referral'],
      default: 'income',
      index: true,
    },
    amount: { type: Number, required: true, min: 1 },
    fee: { type: Number, required: true, default: 0, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    bankAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount' },
    paymentMethodId: { type: Schema.Types.ObjectId, ref: 'PaymentMethod' },
    methodCode: { type: String, index: true },
    network: { type: String },
    currency: { type: String, default: 'INR' },
    destinationAddress: { type: String },
    destinationUpi: { type: String },
    destinationBankSnapshot: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['pending', 'approved', 'processing', 'completed', 'rejected', 'failed'],
      default: 'pending',
      index: true,
    },
    payoutReference: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    internalNote: { type: String },
    reserveTransactionId: { type: String },
    idempotencyKey: { type: String },
  },
  { timestamps: true }
);

withdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });
withdrawalRequestSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

export const WithdrawalRequest = mongoose.model<IWithdrawalRequest>(
  'WithdrawalRequest',
  withdrawalRequestSchema
);
