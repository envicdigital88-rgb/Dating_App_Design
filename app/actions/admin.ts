'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { or } from '@prisma/orm-postgres/orm-client'
import { Temporal } from 'temporal-polyfill'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendAdminInviteEmail } from '@/lib/admin-invite-email'

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

    if (state === 'rejected') {
      await db.orm.public.Photo.where({ id: photoId }).delete();
    } else {
      await db.orm.public.Photo.where({ id: photoId }).update({ moderation: state });
    }
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

    const users = await db.orm.public.User.where({ role: 'member' }).limit(2500).all();
    const photos = await db.orm.public.Photo.limit(10000).all();
    
    const sortedUsers = [...users].sort((a: any, b: any) =>
      Temporal.Instant.compare(b.createdAt, a.createdAt)
    );
    
    return { 
      ok: true, 
      data: sortedUsers.map(u => ({
        ...u,
        createdAt: u.createdAt.toString(),
        lastActiveAt: u.lastActiveAt?.toString() || u.createdAt.toString(),
        lastDailyBonusAt: u.lastDailyBonusAt?.toString() || null,
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

export async function setUserUnlimitedAction(userId: string, isUnlimited: boolean) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const admin = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (admin?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    await db.orm.public.User.where({ id: userId }).update({ isUnlimited: Boolean(isUnlimited) });
    return { ok: true, isUnlimited: Boolean(isUnlimited) };
  } catch (err: any) {
    console.error('setUserUnlimitedAction error:', err);
    return { ok: false, error: err?.message || 'Failed to set unlimited status' };
  }
}

export async function getAdminModerationDataAction() {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const admin = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (admin?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    const reports = await db.orm.public.Report.all();
    const userIds = new Set(reports.map(r => r.targetUserId));
    
    const photos = await db.orm.public.Photo.where({ moderation: 'pending' }).all();
    photos.forEach(p => userIds.add(p.userId));

    const users = await db.orm.public.User.where((u) => u.id.in(Array.from(userIds))).all();
    
    return { 
      ok: true, 
      reports: reports.map(r => ({
        ...r,
        createdAt: r.createdAt.toString(),
        targetName: users.find(u => u.id === r.targetUserId)?.name || 'Member'
      })),
      photos: photos.map(p => ({
        ...p,
        uploadedAt: p.uploadedAt.toString(),
        ownerName: users.find(u => u.id === p.userId)?.name || 'Member'
      }))
    };
  } catch (err) {
    console.error('getAdminModerationDataAction error:', err);
    return { ok: false, error: 'Failed to fetch admin moderation data' };
  }
}

export async function getAdminActivityDataAction() {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const admin = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (admin?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    const [
      totalWingles,
      acceptedWingles,
      declinedWingles,
      minglesSent,
      blocksCount,
      chatReportsCount,
      allWingles,
      allMembers,
      allSubscriptions,
      allPackages,
      allMingles,
      allUsage
    ] = await Promise.all([
      db.orm.public.Wingle.aggregate(a => ({ count: a.count() })).then(r => r.count),
      db.orm.public.Wingle.where({ status: 'accepted' }).aggregate(a => ({ count: a.count() })).then(r => r.count),
      db.orm.public.Wingle.where({ status: 'declined' }).aggregate(a => ({ count: a.count() })).then(r => r.count),
      db.orm.public.Mingle.aggregate(a => ({ count: a.count() })).then(r => r.count),
      db.orm.public.Block.aggregate(a => ({ count: a.count() })).then(r => r.count),
      db.orm.public.Report.where({ context: 'chat' }).aggregate(a => ({ count: a.count() })).then(r => r.count),
      db.orm.public.Wingle.all(),
      db.orm.public.User.where({ role: 'member' }).all(),
      db.orm.public.Subscription.where({ status: 'active' }).all(),
      db.orm.public.Package.all(),
      db.orm.public.Mingle.select('senderId').all(),
      db.orm.public.Usage.all()
    ]);

    // Format recent wingles (sorted descending by creation date)
    const sortedWingles = [...allWingles].sort((a: any, b: any) =>
      Temporal.Instant.compare(b.createdAt, a.createdAt)
    ).slice(0, 30);

    const wingleUserIds = new Set<string>();
    sortedWingles.forEach(w => {
      wingleUserIds.add(w.fromUserId);
      wingleUserIds.add(w.toUserId);
    });

    const wingleUsers = await db.orm.public.User.where(u => u.id.in(Array.from(wingleUserIds))).all();

    const recentWingles = sortedWingles.map(w => ({
      id: w.id,
      fromUserId: w.fromUserId,
      fromUserName: wingleUsers.find(u => u.id === w.fromUserId)?.name || 'Member',
      toUserId: w.toUserId,
      toUserName: wingleUsers.find(u => u.id === w.toUserId)?.name || 'Member',
      note: w.note || '',
      status: w.status,
      createdAt: w.createdAt.toString(),
      respondedAt: w.respondedAt ? w.respondedAt.toString() : null
    }));

    // Precompute message & wingle counts
    const minglesCountBySender: Record<string, number> = {};
    for (const m of allMingles) {
      minglesCountBySender[m.senderId] = (minglesCountBySender[m.senderId] || 0) + 1;
    }

    const winglesCountBySender: Record<string, number> = {};
    for (const w of allWingles) {
      winglesCountBySender[w.fromUserId] = (winglesCountBySender[w.fromUserId] || 0) + 1;
    }

    const usageByUser: Record<string, { chatUsed: number; winglesUsed: number }> = {};
    for (const u of allUsage) {
      usageByUser[u.userId] = { chatUsed: u.chatUsed, winglesUsed: u.winglesUsed };
    }

    const freePackage = {
      id: 'free',
      name: 'Free',
      chatLimit: 5,
      wingleLimit: 3,
      price: 0
    };

    const now = Temporal.Now.instant();
    const usageRows = allMembers.map(member => {
      const userSub = allSubscriptions.find(s => {
        if (s.userId !== member.id) return false;
        return Temporal.Instant.compare(s.expiresAt, now) > 0;
      });

      const pkg = userSub
        ? allPackages.find(p => p.id === userSub.packageId) || freePackage
        : freePackage;

      const userUsage = usageByUser[member.id];
      const chatUsed = userUsage !== undefined ? userUsage.chatUsed : (minglesCountBySender[member.id] || 0);
      const winglesUsed = userUsage !== undefined ? userUsage.winglesUsed : Math.max(member.freeWinglesSent || 0, winglesCountBySender[member.id] || 0);

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        lastActiveAt: member.lastActiveAt ? member.lastActiveAt.toString() : member.createdAt.toString(),
        pkg: {
          id: pkg.id,
          name: pkg.name,
          chatLimit: pkg.chatLimit,
          wingleLimit: pkg.wingleLimit,
        },
        chatUsed,
        winglesUsed,
      };
    }).sort((a, b) => 
      (b.chatUsed + b.winglesUsed) - (a.chatUsed + a.winglesUsed) ||
      new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
    );

    const acceptRate = (acceptedWingles + declinedWingles) > 0
      ? Math.round((acceptedWingles / (acceptedWingles + declinedWingles)) * 100)
      : totalWingles > 0
        ? Math.round((acceptedWingles / totalWingles) * 100)
        : 0;

    return {
      ok: true,
      data: {
        totalWingles,
        acceptedWingles,
        declinedWingles,
        acceptRate,
        minglesSent,
        blocksCount,
        chatReportsCount,
        recentWingles,
        usageRows
      }
    };
  } catch (err) {
    console.error('getAdminActivityDataAction error:', err);
    return { ok: false, error: 'Failed to fetch admin activity data' };
  }
}

export async function resetMemberUsageAction(targetUserId: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const admin = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (admin?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    // Reset user's free counters
    await db.orm.public.User.where({ id: targetUserId }).update({
      freeWinglesSent: 0,
      freeWinglesAccepted: 0
    });

    // Reset or initialize usage table
    const existingUsage = await db.orm.public.Usage.where({ userId: targetUserId }).first();
    if (existingUsage) {
      await db.orm.public.Usage.where({ userId: targetUserId }).update({
        chatUsed: 0,
        winglesUsed: 0
      });
    } else {
      await db.orm.public.Usage.create({
        userId: targetUserId,
        chatUsed: 0,
        winglesUsed: 0
      });
    }

    return { ok: true };
  } catch (err) {
    console.error('resetMemberUsageAction error:', err);
    return { ok: false, error: 'Failed to reset member usage' };
  }
}

export async function getAdminListAction() {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const caller = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (caller?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    const admins = await db.orm.public.User.where({ role: 'admin' }).all();
    const sortedAdmins = [...admins].sort((a: any, b: any) =>
      Temporal.Instant.compare(b.createdAt, a.createdAt)
    );

    return {
      ok: true,
      isCallerSuperAdmin: caller.email === 'envicdigital88@gmail.com',
      data: sortedAdmins.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        verified: u.verified,
        suspended: u.suspended,
        createdAt: u.createdAt.toString(),
        lastActiveAt: u.lastActiveAt?.toString() || u.createdAt.toString(),
        isSuperAdmin: u.email === 'envicdigital88@gmail.com'
      }))
    };
  } catch (err) {
    console.error('getAdminListAction error:', err);
    return { ok: false, error: 'Failed to fetch admin team' };
  }
}

export async function addAdminAction(input: { name: string; email: string; password?: string }) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const caller = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (caller?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    // Only the Super Admin (envicdigital88@gmail.com) can add new admins
    if (caller.email !== 'envicdigital88@gmail.com') {
      return { ok: false, error: 'Only the Super Administrator (envicdigital88@gmail.com) can add new administrators.' };
    }

    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();

    if (!name || name.length < 2) {
      return { ok: false, error: 'Name must be at least 2 characters long' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { ok: false, error: 'Please provide a valid email address' };
    }

    // Generate secure temporary password if not provided
    const plainPassword = input.password?.trim() || `WmAdmin#${crypto.randomBytes(4).toString('hex')}!`;
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const existingUser = await db.orm.public.User.where({ email }).first();

    if (existingUser) {
      // Elevate existing user to admin
      await db.orm.public.User.where({ id: existingUser.id }).update({
        role: 'admin',
        name: name || existingUser.name,
        password: hashedPassword,
        verified: true,
        suspended: false
      });
    } else {
      // Create new admin user
      await db.orm.public.User.create({
        name,
        email,
        phone: '',
        password: hashedPassword,
        role: 'admin',
        age: 25,
        gender: 'non-binary',
        intention: 'Platform Administration',
        interests: '[]',
        traits: '[]',
        lifestyle: JSON.stringify({}),
        verified: true,
        suspended: false,
        onboarded: true
      });
    }

    // Send access credentials from noreply@winglemingle.com
    const emailRes = await sendAdminInviteEmail({
      name,
      email,
      temporaryPassword: plainPassword
    });

    return {
      ok: true,
      message: `Admin access granted to ${email}`,
      emailSent: emailRes.ok,
      simulated: emailRes.simulated || false
    };
  } catch (err: any) {
    console.error('addAdminAction error:', err);
    return { ok: false, error: err?.message || 'Failed to add admin user' };
  }
}

export async function removeAdminAction(targetUserId: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const caller = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (caller?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    // Only the Super Admin (envicdigital88@gmail.com) can remove admins
    if (caller.email !== 'envicdigital88@gmail.com') {
      return { ok: false, error: 'Only the Super Administrator (envicdigital88@gmail.com) can remove administrators.' };
    }

    if (targetUserId === caller.id) {
      return { ok: false, error: 'You cannot revoke your own administrator privileges.' };
    }

    const targetUser = await db.orm.public.User.where({ id: targetUserId }).first();
    if (!targetUser) {
      return { ok: false, error: 'Target admin user not found' };
    }

    if (targetUser.email === 'envicdigital88@gmail.com') {
      return { ok: false, error: 'Primary Super Administrator cannot be removed.' };
    }

    await db.orm.public.User.where({ id: targetUserId }).update({
      role: 'member'
    });

    return { ok: true };
  } catch (err) {
    console.error('removeAdminAction error:', err);
    return { ok: false, error: 'Failed to remove admin' };
  }
}

export async function resendAdminInviteAction(targetUserId: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const caller = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (caller?.role !== 'admin') return { ok: false, error: 'Forbidden' };

    // Only the Super Admin (envicdigital88@gmail.com) can resend admin credentials
    if (caller.email !== 'envicdigital88@gmail.com') {
      return { ok: false, error: 'Only the Super Administrator can resend admin access credentials.' };
    }

    const targetUser = await db.orm.public.User.where({ id: targetUserId }).first();
    if (!targetUser || targetUser.role !== 'admin') {
      return { ok: false, error: 'Admin user not found' };
    }

    const newTempPassword = `WmAdmin#${crypto.randomBytes(4).toString('hex')}!`;
    const hashedPassword = await bcrypt.hash(newTempPassword, 12);

    await db.orm.public.User.where({ id: targetUserId }).update({
      password: hashedPassword
    });

    const emailRes = await sendAdminInviteEmail({
      name: targetUser.name,
      email: targetUser.email,
      temporaryPassword: newTempPassword
    });

    return {
      ok: true,
      message: `Access email resent to ${targetUser.email}`,
      emailSent: emailRes.ok,
      simulated: emailRes.simulated || false
    };
  } catch (err: any) {
    console.error('resendAdminInviteAction error:', err);
    return { ok: false, error: err?.message || 'Failed to resend invite' };
  }
}

