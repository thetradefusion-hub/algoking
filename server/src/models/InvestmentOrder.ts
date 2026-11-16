import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type OrderStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface IPlanSnapshot {
  name: string;
  investmentAmount: number;
  durationDays: number;
  projectedDailyIncome: number;
  projectedTotalIncome: number;
}

export interface IInvestmentOrder extends Document {
  orderId: string;
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  planSnapshot: IPlanSnapshot;
  amount: number;
  durationDays: number;
  projectedIncomeSnapshot: number;
  status: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  /** Completed hours already credited to Income Wallet */
  paidHours: number;
  /** Total ROI amount already credited (INR) */
  totalIncomePaid: number;
  lastPayoutAt?: Date;
  walletTransactionId?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const investmentOrderSchema = new Schema<IInvestmentOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true, index: true },
    planSnapshot: {
      name: String,
      investmentAmount: Number,
      durationDays: Number,
      projectedDailyIncome: Number,
      projectedTotalIncome: Number,
    },
    amount: { type: Number, required: true, min: 1 },
    durationDays: { type: Number, required: true },
    projectedIncomeSnapshot: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    startDate: { type: Date },
    endDate: { type: Date },
    paidHours: { type: Number, default: 0, min: 0 },
    totalIncomePaid: { type: Number, default: 0, min: 0 },
    lastPayoutAt: { type: Date },
    walletTransactionId: { type: String },
    idempotencyKey: { type: String },
  },
  { timestamps: true }
);

investmentOrderSchema.index({ userId: 1, createdAt: -1 });
investmentOrderSchema.index({ status: 1, endDate: 1 });
investmentOrderSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

export const InvestmentOrder = mongoose.model<IInvestmentOrder>(
  'InvestmentOrder',
  investmentOrderSchema
);
