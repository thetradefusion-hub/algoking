import { SupportTicket, SupportMessage } from '../models/SupportTicket.js';
import { ApiError } from '../utils/apiError.js';
import { generateTicketNumber } from '../utils/ids.js';

export async function createTicket(
  userId: string,
  data: { subject: string; category: string; message: string; attachments?: string[] }
) {
  const ticket = await SupportTicket.create({
    userId,
    ticketNumber: generateTicketNumber(),
    subject: data.subject,
    category: data.category,
    message: data.message,
    status: 'open',
    attachments: data.attachments || [],
  });

  await SupportMessage.create({
    ticketId: ticket._id,
    senderId: userId,
    senderRole: 'user',
    message: data.message,
    attachments: data.attachments || [],
  });

  return ticket;
}

export async function listUserTickets(userId: string, opts: { skip: number; limit: number }) {
  const filter = { userId };
  const [items, total] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip(opts.skip).limit(opts.limit).lean(),
    SupportTicket.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getTicket(userId: string, id: string, isAdmin = false) {
  const filter = isAdmin ? { _id: id } : { _id: id, userId };
  const ticket = await SupportTicket.findOne(filter).lean();
  if (!ticket) throw ApiError.notFound('Ticket not found');
  const messages = await SupportMessage.find({ ticketId: ticket._id }).sort({ createdAt: 1 }).lean();
  return { ticket, messages };
}

export async function replyToTicket(
  opts: {
    ticketId: string;
    senderId: string;
    senderRole: string;
    message: string;
    attachments?: string[];
    userId?: string;
    isAdmin?: boolean;
  }
) {
  const filter = opts.isAdmin
    ? { _id: opts.ticketId }
    : { _id: opts.ticketId, userId: opts.userId };
  const ticket = await SupportTicket.findOne(filter);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (ticket.status === 'closed') throw ApiError.badRequest('Ticket is closed');

  const msg = await SupportMessage.create({
    ticketId: ticket._id,
    senderId: opts.senderId,
    senderRole: opts.senderRole,
    message: opts.message,
    attachments: opts.attachments || [],
  });

  if (opts.isAdmin && ticket.status === 'open') {
    ticket.status = 'in_progress';
    await ticket.save();
  }

  return msg;
}

export async function adminListTickets(opts: { skip: number; limit: number; status?: string }) {
  const filter: Record<string, unknown> = {};
  if (opts.status) filter.status = opts.status;
  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('userId', 'fullName email mobile')
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    SupportTicket.countDocuments(filter),
  ]);
  return { items, total };
}

export async function updateTicketStatus(id: string, status: string, assignedTo?: string) {
  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  ticket.status = status as typeof ticket.status;
  if (assignedTo) ticket.assignedTo = assignedTo as unknown as typeof ticket.assignedTo;
  await ticket.save();
  return ticket;
}
