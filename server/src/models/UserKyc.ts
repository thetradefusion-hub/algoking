import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface IUserKyc extends Document {
  userId: Types.ObjectId;
  fullName: string;
  dateOfBirth?: Date;
  panNumberEncrypted: string;
  panLast4: string;
  bankAccountHolder?: string;
  bankAccountNumberEncrypted?: string;
  bankAccountLast4?: string;
  ifscCode?: string;
  documentPaths: string[];
  status: KycStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userKycSchema = new Schema<IUserKyc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date },
    panNumberEncrypted: { type: String, required: true },
    panLast4: { type: String, required: true },
    bankAccountHolder: { type: String },
    bankAccountNumberEncrypted: { type: String },
    bankAccountLast4: { type: String },
    ifscCode: { type: String, uppercase: true },
    documentPaths: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const UserKyc = mongoose.model<IUserKyc>('UserKyc', userKycSchema);
