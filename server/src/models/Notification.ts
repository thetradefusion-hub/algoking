import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true, index: true },
    isRead: { type: Boolean, default: false, index: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
