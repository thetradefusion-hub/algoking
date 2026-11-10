import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

export async function listNotifications(userId: string, opts: { skip: number; limit: number }) {
  const filter = { userId };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(opts.skip).limit(opts.limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);
  return { items, total, unread };
}

export async function markRead(userId: string, id: string) {
  const n = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!n) throw ApiError.notFound('Notification not found');
  return n;
}

export async function markAllRead(userId: string) {
  await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
  return { success: true };
}

export async function createAnnouncement(opts: {
  title: string;
  message: string;
  userIds?: string[];
  statusFilter?: string;
}) {
  let recipients: string[] = opts.userIds || [];
  if (!recipients.length) {
    const filter: Record<string, unknown> = { role: 'user' };
    if (opts.statusFilter) filter.status = opts.statusFilter;
    const users = await User.find(filter).select('_id').lean();
    recipients = users.map((u) => u._id.toString());
  }

  if (!recipients.length) return { created: 0 };

  const docs = recipients.map((userId) => ({
    userId,
    title: opts.title,
    message: opts.message,
    type: 'announcement',
    isRead: false,
  }));

  // Bulk insert in chunks
  const chunkSize = 500;
  let created = 0;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    await Notification.insertMany(chunk);
    created += chunk.length;
  }
  return { created };
}
