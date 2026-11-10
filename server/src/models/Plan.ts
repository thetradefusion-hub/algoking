import mongoose, { Schema, type Document } from 'mongoose';

export type PlanStatus = 'active' | 'inactive' | 'archived';

export interface IPlan extends Document {
  name: string;
  slug: string;
  description: string;
  image?: string;
  iconEmoji?: string;
  badgeLabel?: string;
  isFeatured: boolean;
  isPopular: boolean;
  investmentAmount: number;
  durationDays: number;
  projectedDailyIncome: number;
  projectedTotalIncome: number;
  status: PlanStatus;
  purchaseLimit: number;
  eligibilityRules: Record<string, unknown>;
  sortOrder: number;
  riskDisclosure: string;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    image: { type: String },
    iconEmoji: { type: String, default: '📈' },
    badgeLabel: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    investmentAmount: { type: Number, required: true, min: 1 },
    durationDays: { type: Number, required: true, min: 1 },
    projectedDailyIncome: { type: Number, required: true, min: 0 },
    projectedTotalIncome: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active', index: true },
    purchaseLimit: { type: Number, default: 0 },
    eligibilityRules: { type: Schema.Types.Mixed, default: {} },
    sortOrder: { type: Number, default: 0 },
    riskDisclosure: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

planSchema.index({ status: 1, sortOrder: 1 });

export const Plan = mongoose.model<IPlan>('Plan', planSchema);
