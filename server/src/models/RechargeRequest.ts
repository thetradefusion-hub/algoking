import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type RechargeStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rejected';

export interface IRechargeRequest extends Document {
  userId: Types.ObjectId;
  amount: number;
  paymentMethod: string;
  paymentMethodId?: Types.ObjectId;
  methodCode?: string;
  network?: string;
  currency?: string;
  proofReference?: string;
  userNote?: string;
  depositSnapshot?: Record<string, unknown>;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  status: RechargeStatus;
  verificationReference?: string;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  isManual: boolean;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const rechargeRequestSchema = new Schema<IRechargeRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, required: true, default: 'demo' },
    paymentMethodId: { type: Schema.Types.ObjectId, ref: 'PaymentMethod' },
    methodCode: { type: String, index: true },
    network: { type: String },
    currency: { type: String, default: 'INR' },
    proofReference: { type: String },
    userNote: { type: String },
    depositSnapshot: { type: Schema.Types.Mixed },
    gatewayOrderId: { type: String, index: true },
    gatewayPaymentId: { type: String, index: true },
    status: {
      type: String,
      enum: ['pending', 'awaiting_payment', 'processing', 'completed', 'failed', 'rejected'],
      default: 'pending',
      index: true,
    },
    verificationReference: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    isManual: { type: Boolean, default: false },
    idempotencyKey: { type: String },
  },
  { timestamps: true }
);

rechargeRequestSchema.index({ userId: 1, createdAt: -1 });
rechargeRequestSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

export const RechargeRequest = mongoose.model<IRechargeRequest>(
  'RechargeRequest',
  rechargeRequestSchema
);
