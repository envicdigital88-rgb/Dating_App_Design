import { and, or } from '@prisma/orm-postgres/orm-client';
import { Temporal } from 'temporal-polyfill';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { PRESENCE_BATCH_SIZE, recordedLastSeen } from '@/lib/presence';

const headers = { 'Cache-Control': 'private, no-store' };

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (typeof session?.userId !== 'string' || session.verified === false) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
    const body = await request.json().catch(() => null);
    if (body?.accountId !== session.userId || !Array.isArray(body?.ids) || body.ids.length > PRESENCE_BATCH_SIZE) {
      return Response.json({ error: 'Invalid presence request' }, { status: 400, headers });
    }
    const userId = session.userId;
    const ids = [...new Set<string>(body.ids.filter((id: unknown): id is string =>
      typeof id === 'string' && id.length > 0 && id.length <= 128 && id !== userId))];
    const viewer = await db.orm.public.User.select('suspended', 'createdAt').first({ id: userId });
    if (!viewer || viewer.suspended) return Response.json({ error: 'Forbidden' }, { status: 403, headers });

    const now = Temporal.Now.instant();
    // Tabs can share a login. Throttling their writes avoids unnecessary updates without marking another tab offline.
    await db.orm.public.User.where({ id: userId, suspended: false })
      .where(u => or(u.lastActiveAt.lt(now.subtract({ seconds: 8 })), u.lastActiveAt.eq(viewer.createdAt)))
      .update({ lastActiveAt: now });

    if (ids.length === 0) return Response.json({ userId, lastSeen: {} }, { headers });

    const [members, blocks, wingles] = await Promise.all([
      db.orm.public.User.select('id', 'lastActiveAt', 'createdAt', 'discoverable', 'onboarded', 'selfieStatus', 'isUnlimited')
        .where({ role: 'member', suspended: false, showOnline: true }).where(u => u.id.in(ids)).all(),
      db.orm.public.Block.select('blockerId', 'blockedUserId').where(b => or(
        and(b.blockerId.eq(userId), b.blockedUserId.in(ids)),
        and(b.blockedUserId.eq(userId), b.blockerId.in(ids))
      )).all(),
      db.orm.public.Wingle.select('fromUserId', 'toUserId').where({ status: 'accepted' }).where(w => or(
        and(w.fromUserId.eq(userId), w.toUserId.in(ids)),
        and(w.toUserId.eq(userId), w.fromUserId.in(ids))
      )).all(),
    ]);
    const blocked = new Set(blocks.map(b => b.blockerId === userId ? b.blockedUserId : b.blockerId));
    const connected = new Set(wingles.map(w => w.fromUserId === userId ? w.toUserId : w.fromUserId));
    const lastSeen = Object.fromEntries(members.filter(member =>
      !blocked.has(member.id) && (connected.has(member.id) ||
        (member.discoverable && member.onboarded && (member.isUnlimited || member.selfieStatus === 'approved')))
    ).map(member => [member.id, recordedLastSeen(member)]));
    return Response.json({ userId, lastSeen }, { headers });
  } catch {
    console.error('Could not update member presence.');
    return Response.json({ error: 'Presence unavailable' }, { status: 500, headers });
  }
}
