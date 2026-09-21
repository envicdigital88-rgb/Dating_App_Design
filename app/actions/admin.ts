'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { or } from '@prisma/orm-postgres/orm-client'

export async function getAdminOverviewStatsAction() {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    // Verify admin
    const caller = await db.orm.public.User.where({ id: session.userId as string }).first()
    if (!caller || caller.role !== 'admin') {
      return { ok: false, error: 'Forbidden' }
    }

    // Fetch required data
    const [
      users,
      wingles,
      payments,
      subscriptions,
      packages,
      minglesCount,
      connectionsCount,
      reports
    ] = await Promise.all([
      db.orm.public.User.where({ role: 'member' }).all(),
      db.orm.public.Wingle.all(),
      db.orm.public.Payment.all(),
      db.orm.public.Subscription.all(),
      db.orm.public.Package.all(),
      db.orm.public.Mingle.aggregate((a) => ({ count: a.count() })).then(r => r.count),
      db.orm.public.Connection.aggregate((a) => ({ count: a.count() })).then(r => r.count),
      db.orm.public.Report.all()
    ]);

    // For latest activity, we need the related users for the last 6 wingles
    const latestWingles = [...wingles]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
      
    const latestWingleUserIds = new Set<string>();
    latestWingles.forEach(w => {
      latestWingleUserIds.add(w.fromUserId);
      latestWingleUserIds.add(w.toUserId);
    });
    
    const latestWingleUsers = await db.orm.public.User.where(
      (u) => u.id.in(Array.from(latestWingleUserIds))
    ).all();

    return {
      ok: true,
      data: {
        users: users.map(u => ({ id: u.id, lastActiveAt: u.lastActiveAt.toString(), createdAt: u.createdAt.toString() })),
        wingles: wingles.map(w => ({ id: w.id, status: w.status })),
        payments: payments.map(p => ({ status: p.status, amount: p.amount, packageId: p.packageId })),
        subscriptions: subscriptions.map(s => ({ status: s.status, expiresAt: s.expiresAt.toString() })),
        packages: packages.map(p => ({ id: p.id, name: p.name, price: p.price })),
        minglesCount,
        connectionsCount,
        reports: reports.map(r => ({ status: r.status })),
        latestActivity: latestWingles.map(w => ({
          id: w.id,
          createdAt: w.createdAt.toString(),
          status: w.status,
          fromUserName: latestWingleUsers.find(u => u.id === w.fromUserId)?.name || 'Member',
          toUserName: latestWingleUsers.find(u => u.id === w.toUserId)?.name || 'Member'
        }))
      }
    }

  } catch (error) {
    console.error('getAdminOverviewStatsAction error:', error)
    return { ok: false, error: 'Failed to fetch admin stats' }
  }
}

export async function deleteUserAction(targetUserId: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    // Verify admin
    const caller = await db.orm.public.User.where({ id: session.userId as string }).first()
    if (!caller || caller.role !== 'admin') {
      return { ok: false, error: 'Forbidden' }
    }

    // Delete conversations where this user is a participant (cascades to Mingles)
    await db.orm.public.Conversation.where((c) => or(c.userId1.eq(targetUserId), c.userId2.eq(targetUserId))).delete();

    // Delete connections where this user is a participant
    await db.orm.public.Connection.where((c) => or(c.userId1.eq(targetUserId), c.userId2.eq(targetUserId))).delete();

    // Delete the user (this cascades to likes, passes, wingles, etc.)
    await db.orm.public.User.where({ id: targetUserId }).delete();

    return { ok: true }
  } catch (err) {
    console.error('deleteUserAction error:', err)
    return { ok: false, error: 'Failed to delete user completely' }
  }
}
