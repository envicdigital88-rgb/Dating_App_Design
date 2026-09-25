'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function reportUserAction(targetUserId: string, reason: string, detail: string, context: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const userId = session.userId as string

    // Create Report
    await db.orm.public.Report.create({
      id: `rp_${Math.random().toString(36).substr(2, 9)}`,
      reporterId: userId,
      targetUserId,
      reason,
      detail,
      context,
      status: 'open',
    })

    // Check if user has 5 or more reports and suspend them if so
    const totals = await db.orm.public.Report.where({ targetUserId }).aggregate((a) => ({
      count: a.count()
    }))
    if (totals.count >= 5) {
      await db.orm.public.User.where({ id: targetUserId }).update({ suspended: true })
    }

    return { ok: true }
  } catch (err) {
    console.error('reportUser error:', err)
    return { ok: false, error: 'Failed to report user' }
  }
}

export async function blockUserAction(targetUserId: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const userId = session.userId as string

    // Check if already blocked
    const existing = await db.orm.public.Block
      .where((b) => b.blockerId.eq(userId))
      .where((b) => b.blockedUserId.eq(targetUserId))
      .first()
      
    if (existing) {
      return { ok: false, error: 'User is already blocked' }
    }

    // Create Block
    await db.orm.public.Block.create({
      id: `bl_${Math.random().toString(36).substr(2, 9)}`,
      blockerId: userId,
      blockedUserId: targetUserId,
    })

    const { pusherServer } = await import('@/lib/pusher');
    await pusherServer.trigger(`private-user-${targetUserId}`, 'state-changed', {}).catch(console.error);

    return { ok: true }
  } catch (err) {
    console.error('blockUser error:', err)
    return { ok: false, error: 'Failed to block user' }
  }
}

export async function unblockUserAction(targetUserId: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const userId = session.userId as string

    const existing = await db.orm.public.Block
      .where((b) => b.blockerId.eq(userId))
      .where((b) => b.blockedUserId.eq(targetUserId))
      .first()
      
    if (existing) {
      await db.orm.public.Block.where((b) => b.id.eq(existing.id)).delete()
      
      const { pusherServer } = await import('@/lib/pusher');
      await pusherServer.trigger(`private-user-${targetUserId}`, 'state-changed', {}).catch(console.error);
    }

    return { ok: true }
  } catch (err) {
    console.error('unblockUser error:', err)
    return { ok: false, error: 'Failed to unblock user' }
  }
}
