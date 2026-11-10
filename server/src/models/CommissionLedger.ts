import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export interface ICommissionLedger extends Document {
  userId: Types.ObjectId;
  sourceUserId: Types.ObjectId;
  sourceTransactionId: string;
  level: number;
  percentageSnapshot: number;
  ruleVersion: number;
  commissionAmount: number;
  qualifyingAmount: number;
  status: CommissionStatus;
  walletTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const commissionLedgerSchema = new Schema<ICommissionLedger>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sourceUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sourceTransactionId: { type: String, required: true },
    level: { type: Number, required: true },
    percentageSnapshot: { type: Number, required: true },
    ruleVersion: { type: Number, required: true },
    commissionAmount: { type: Number, required: true, min: 0 },
    qualifyingAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'cancelled'],
      default: 'paid',
      index: true,
    },
    walletTransactionId: { type: String },
  },
  { timestamps: true }
);

commissionLedgerSchema.index(
  { userId: 1, sourceTransactionId: 1, level: 1 },
  { unique: true }
);
commissionLedgerSchema.index({ createdAt: -1 });

export const CommissionLedger = mongoose.model<ICommissionLedger>(
  'CommissionLedger',
  commissionLedgerSchema
);
