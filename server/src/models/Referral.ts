import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IReferral extends Document {
  userId: Types.ObjectId;
  sponsorId: Types.ObjectId;
  referralCodeUsed: string;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sponsorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referralCodeUsed: { type: String, required: true },
    level: { type: Number, required: true, min: 1, max: 10 },
  },
  { timestamps: true }
);

referralSchema.index({ userId: 1, level: 1 }, { unique: true });
referralSchema.index({ sponsorId: 1, level: 1, createdAt: -1 });

export const Referral = mongoose.model<IReferral>('Referral', referralSchema);
