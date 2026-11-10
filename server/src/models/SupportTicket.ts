import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ISupportTicket extends Document {
  userId: Types.ObjectId;
  ticketNumber: string;
  subject: string;
  category: string;
  message: string;
  status: TicketStatus;
  assignedTo?: Types.ObjectId;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportMessage extends Document {
  ticketId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: string;
  message: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ticketNumber: { type: String, required: true, unique: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true }
);

const supportMessageSchema = new Schema<ISupportMessage>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, required: true },
    message: { type: String, required: true },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
export const SupportMessage = mongoose.model<ISupportMessage>(
  'SupportMessage',
  supportMessageSchema
);
