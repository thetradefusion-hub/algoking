import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type UserRole = 'user' | 'admin' | 'super_admin' | 'finance_manager' | 'support_manager' | 'kyc_manager';
export type UserStatus = 'active' | 'inactive' | 'blocked' | 'pending';

export interface IUser extends Document {
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: UserRole;
  permissions: string[];
  referralCode: string;
  referredBy?: Types.ObjectId;
  status: UserStatus;
  emailVerified: boolean;
  mobileVerified: boolean;
  profileImage?: string;
  lastLoginAt?: Date;
  refreshTokenHash?: string;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  adminRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['user', 'admin', 'super_admin', 'finance_manager', 'support_manager', 'kyc_manager'],
      default: 'user',
      index: true,
    },
    permissions: { type: [String], default: [] },
    referralCode: { type: String, required: true, unique: true, uppercase: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked', 'pending'],
      default: 'active',
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    mobileVerified: { type: Boolean, default: false },
    profileImage: { type: String },
    lastLoginAt: { type: Date },
    refreshTokenHash: { type: String, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    adminRemarks: { type: String },
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });
userSchema.index({ referredBy: 1, createdAt: -1 });
userSchema.index({ role: 1, status: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
