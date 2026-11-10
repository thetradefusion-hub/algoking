import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IBankAccount extends Document {
  userId: Types.ObjectId;
  accountHolderName: string;
  accountNumberEncrypted: string;
  accountNumberLast4: string;
  ifscCode: string;
  bankName: string;
  isPrimary: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const bankAccountSchema = new Schema<IBankAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountHolderName: { type: String, required: true, trim: true },
    accountNumberEncrypted: { type: String, required: true },
    accountNumberLast4: { type: String, required: true },
    ifscCode: { type: String, required: true, uppercase: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    isPrimary: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
  },
  { timestamps: true }
);

bankAccountSchema.index({ userId: 1, isPrimary: -1 });

export const BankAccount = mongoose.model<IBankAccount>('BankAccount', bankAccountSchema);
