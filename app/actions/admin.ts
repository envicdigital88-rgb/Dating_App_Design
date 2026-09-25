'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { or } from '@prisma/orm-postgres/orm-client'
import { Temporal } from 'temporal-polyfill'

export async function getAdminOverviewStatsAction() {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    // Verify admin
    const caller = await db.orm.public.User.where({ id: session.userId as string }).first()
    if (!caller || caller.role !== 'admin') {
      return { ok: false, error: 'Forbidden' }
    }

    const thirtyDaysAgo = Temporal.Now.instant().subtract({ hours: 30 * 24 });
    const oneDayAgo = Temporal.Now.instant().subtract({ hours: 24 });

    // Fetch required data
    const [
      totalMembers,
      womenCount,
      menCount,
      nonBinaryCount,
      newThisMonth,
      activeToday,
      wingles,
      payments,
      subscriptions,
      packages,
      minglesCount,
      connectionsCount,
      reports
    ] = await Promise.all([
      db.orm.public.User.where({ role: 'member' }).aggregate((a) => ({ count: a.count() })).then(r => r.count),
      db.orm.public.User.where({ role: 'member', gender: 'woman' }).aggregate((a) => ({ count: a.count() })).then(r => r.count),
      db.orm.public.User.where({ role: 'member', gender: 'man' }).aggregate((a) => ({ count: a.count() })).then(r => r.count),
      db.orm.public.User.where({ role: 'member', gender: 'non-binary' }).aggregate((a) => ({ count: a.count() })).then(r => r.count),
      db.orm.public.User.where({ role: 'member' }).where((u) => u.createdAt.gt(thirtyDaysAgo)).aggregate((a) => ({ count: a.count() })).then(r => r.count),
      db.orm.public.User.where({ role: 'member' }).where((u) => u.lastActiveAt.gt(oneDayAgo)).aggregate((a) => ({ count: a.count() })).then(r => r.count),
      db.orm.public.Wingle.select('id', 'status', 'createdAt', 'fromUserId', 'toUserId').all(),
      db.orm.public.Payment.select('status', 'amount', 'packageId').all(),
      db.orm.public.Subscription.select('status', 'expiresAt').all(),
      db.orm.public.Package.select('id', 'name', 'price').all(),
      db.orm.public.Mingle.aggregate((a) => ({ count: a.count() })).then(r => r.count),
      db.orm.public.Connection.aggregate((a) => ({ count: a.count() })).then(r => r.count),
      db.orm.public.Report.select('status').all()
    ]);

    // For latest activity, we need the related users for the last 6 wingles
    const latestWingles = [...wingles]
      .sort((a: any, b: any) => Temporal.Instant.compare(b.createdAt, a.createdAt))
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
        totalMembers,
        womenCount,
        menCount,
        nonBinaryCount,
        newThisMonth,
        activeToday,
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

export async function moderatePhotoAction(photoId: string, state: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const user = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (user?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    await db.orm.public.Photo.where({ id: photoId }).update({ moderation: state });
    return { ok: true };
  } catch (err) {
    console.error('moderatePhotoAction error:', err);
    return { ok: false, error: 'Failed to moderate photo' };
  }
}

export async function resolveReportAction(reportId: string, status: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const user = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (user?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    await db.orm.public.Report.where({ id: reportId }).update({ status });
    return { ok: true };
  } catch (err) {
    console.error('resolveReportAction error:', err);
    return { ok: false, error: 'Failed to resolve report' };
  }
}

export async function getAdminUsersAction() {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const admin = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (admin?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    const users = await db.orm.public.User.where({ role: 'member' }).all();
    const photos = await db.orm.public.Photo.all();
    
    return { 
      ok: true, 
      data: users.map(u => ({
        ...u,
        createdAt: u.createdAt.toString(),
        lastActiveAt: u.lastActiveAt?.toString() || u.createdAt.toString(),
        photos: photos.filter(p => p.userId === u.id).sort((a, b) => a.order - b.order).map(p => ({
          ...p,
          uploadedAt: p.uploadedAt.toString()
        }))
      })) 
    };
  } catch (err) {
    console.error('getAdminUsersAction error:', err);
    return { ok: false, error: 'Failed to fetch admin users' };
  }
}

export async function setUserSuspendedAction(userId: string, suspended: boolean) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const admin = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (admin?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    await db.orm.public.User.where({ id: userId }).update({ suspended });
    return { ok: true };
  } catch (err) {
    console.error('setUserSuspendedAction error:', err);
    return { ok: false, error: 'Failed to suspend user' };
  }
}

export async function setUserVerifiedAction(userId: string, verified: boolean) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const admin = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (admin?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    await db.orm.public.User.where({ id: userId }).update({ verified });
    return { ok: true };
  } catch (err) {
    console.error('setUserVerifiedAction error:', err);
    return { ok: false, error: 'Failed to verify user' };
  }
}

