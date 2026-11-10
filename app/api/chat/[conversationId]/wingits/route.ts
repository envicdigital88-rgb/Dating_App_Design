import { and, or } from '@prisma/orm-postgres/orm-client';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import type { WingitsChatEvent } from '@/lib/wingits-chat-events';

const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(_request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const session = await getSession();
    if (typeof session?.userId !== 'string' || session.verified === false) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
    const userId = session.userId;
    const { conversationId } = await params;
    const chat = await db.orm.public.Conversation.first({ id: conversationId });
    if (!chat || (chat.userId1 !== userId && chat.userId2 !== userId)) {
      return Response.json({ error: 'Chat unavailable' }, { status: 404, headers });
    }
    const peer = chat.userId1 === userId ? chat.userId2 : chat.userId1;
    const [accepted, blocked, caller] = await Promise.all([
      db.orm.public.Wingle.where({ status: 'accepted' }).where(w => or(
        and(w.fromUserId.eq(userId), w.toUserId.eq(peer)),
        and(w.fromUserId.eq(peer), w.toUserId.eq(userId))
      )).first(),
      db.orm.public.Block.where(b => or(
        and(b.blockerId.eq(userId), b.blockedUserId.eq(peer)),
        and(b.blockerId.eq(peer), b.blockedUserId.eq(userId))
      )).first(),
      db.orm.public.User.select('suspended').first({ id: userId }),
    ]);
    if (!accepted || blocked || !caller || caller.suspended) {
      return Response.json({ error: 'Chat unavailable' }, { status: 404, headers });
    }

    // These notices are written by the wallet action in the same transaction as the request or transfer.
    const notices = await db.orm.public.Notification.select('id', 'type', 'body', 'userId', 'createdAt')
      .where({ href: '/mingles/' + conversationId })
      .where(n => and(n.userId.in([userId, peer]), n.type.in(['wingits_request', 'wingits_received'])))
      .orderBy(n => n.createdAt.desc()).all();
    const events: WingitsChatEvent[] = notices.flatMap(notice => {
      const kind = notice.type;
      if (kind !== 'wingits_request' && kind !== 'wingits_received') return [];
      const amountText = kind === 'wingits_request'
        ? /^Requested (\d+) Wingits\./.exec(notice.body)?.[1]
        : / sent you (\d+) Wingits\.$/.exec(notice.body)?.[1];
      const amount = Number(amountText);
      if (!Number.isSafeInteger(amount) || amount <= 0) return [];
      return [{
        id: notice.id, kind, amount, createdAt: notice.createdAt.toString(),
        senderId: notice.userId === userId ? peer : userId,
      }];
    });
    return Response.json({ events }, { headers });
  } catch {
    console.error('Could not load Wingits chat history.');
    return Response.json({ error: 'Wingits chat history unavailable' }, { status: 500, headers });
  }
}
