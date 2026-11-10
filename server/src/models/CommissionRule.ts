import mongoose, { Schema, type Document } from 'mongoose';

export interface ICommissionRule extends Document {
  level: number;
  percentage: number;
  eligibleEvent: string;
  minimumQualifyingAmount: number;
  status: 'active' | 'inactive';
  version: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commissionRuleSchema = new Schema<ICommissionRule>(
  {
    level: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    eligibleEvent: { type: String, required: true, default: 'investment_purchase' },
    minimumQualifyingAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    version: { type: Number, required: true, default: 1 },
    effectiveFrom: { type: Date, required: true, default: Date.now },
    effectiveTo: { type: Date },
  },
  { timestamps: true }
);

commissionRuleSchema.index({ level: 1, version: -1 });
commissionRuleSchema.index({ status: 1, eligibleEvent: 1, effectiveFrom: -1 });

export const CommissionRule = mongoose.model<ICommissionRule>(
  'CommissionRule',
  commissionRuleSchema
);
