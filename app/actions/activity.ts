'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import type { ActivitySection } from '@/lib/activity-read-state';

export async function markActivityReadAction(section: ActivitySection, identifiers: string[]) {
  try {
    const session = await getSession();
    if (typeof session?.userId !== 'string') return { ok: false };
    if (!Array.isArray(identifiers) || identifiers.some(id => typeof id !== 'string' || !id)) return { ok: false };
    const ids = [...new Set(identifiers)];
    if (ids.length === 0) return { ok: true };
    const userId = session.userId;

    // Update every item actually displayed, scoped to its owner. Later arrivals stay unread.
    let plan;
    switch (section) {
      case 'likes':
        plan = db.sql.public.like.update({ viewed: true })
          .where((f, fn) => fn.eq(f.toUserId, userId))
          .where((f, fn) => fn.in(f.fromUserId, ids)).build();
        break;
      case 'heartBucket':
        plan = db.sql.public.heartBucket.update({ viewed: true })
          .where((f, fn) => fn.eq(f.userId, userId))
          .where((f, fn) => fn.in(f.targetUserId, ids)).build();
        break;
      case 'passes':
        plan = db.sql.public.pass.update({ viewed: true })
          .where((f, fn) => fn.eq(f.userId, userId))
          .where((f, fn) => fn.in(f.targetUserId, ids)).build();
        break;
      case 'wingles':
        plan = db.sql.public.wingle.update({ viewed: true })
          .where((f, fn) => fn.eq(f.toUserId, userId))
          .where((f, fn) => fn.eq(f.status, 'pending'))
          .where((f, fn) => fn.in(f.id, ids)).build();
        break;
      case 'notifications':
        plan = db.sql.public.notification.update({ read: true })
          .where((f, fn) => fn.eq(f.userId, userId))
          .where((f, fn) => fn.in(f.id, ids)).build();
        break;
      default: return { ok: false };
    }
    await db.runtime().execute(plan);
    return { ok: true };
  } catch (error) {
    console.error('Failed to save activity read status:', error);
    return { ok: false };
  }
}
