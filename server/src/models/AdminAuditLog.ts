import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IAdminAuditLog extends Document {
  adminId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    beforeSnapshot: { type: Schema.Types.Mixed },
    afterSnapshot: { type: Schema.Types.Mixed },
    reason: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ entityType: 1, entityId: 1 });

export const AdminAuditLog = mongoose.model<IAdminAuditLog>(
  'AdminAuditLog',
  adminAuditLogSchema
);
