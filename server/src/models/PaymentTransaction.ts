import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IPaymentTransaction extends Document {
  userId: Types.ObjectId;
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  verifiedAt?: Date;
  rawReference?: Record<string, unknown>;
  rechargeRequestId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, required: true },
    providerOrderId: { type: String, required: true, index: true },
    providerPaymentId: { type: String, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    verifiedAt: { type: Date },
    rawReference: { type: Schema.Types.Mixed },
    rechargeRequestId: { type: Schema.Types.ObjectId, ref: 'RechargeRequest' },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ provider: 1, providerOrderId: 1 }, { unique: true });

export const PaymentTransaction = mongoose.model<IPaymentTransaction>(
  'PaymentTransaction',
  paymentTransactionSchema
);
