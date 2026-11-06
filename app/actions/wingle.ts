'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { Temporal } from 'temporal-polyfill'
import { formatNotifyPhoneNumber, getPhoneVariants, sendNotifySms } from '@/lib/notify'

import { getWingleGift, WINGLE_ACCEPT_COST, WINGLE_SEND_COST } from '@/lib/wingle-pricing'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

class WingleError extends Error {
  constructor(message: string, readonly reason?: 'verification_required' | 'insufficient_wingits') {
    super(message);
  }
}

async function adjustWingleBalance(tx: Transaction, userId: string, amount: number, isUnlimited?: boolean) {
  const update = tx.sql.public.user
    .update((fields, fns) => ({
      wingitsBalance: fns.raw`${fields.wingitsBalance} + ${amount}`.returns('pg/int4@1'),
    }))
    .where((fields, fns) => fns.eq(fields.id, userId))
    .where((fields, fns) => fns.gte(fields.wingitsBalance, Math.max(0, -amount)));
  const plan = isUnlimited === undefined
    ? update.build()
    : update.where((fields, fns) => fns.eq(fields.isUnlimited, isUnlimited)).build();
  const { affectedRows } = await tx.execute(plan);
  if (affectedRows !== 1) {
    throw new WingleError('Unable to charge Wingits. Check your balance and try again.', 'insufficient_wingits');
  }
  const user = await tx.orm.public.User.select('wingitsBalance').first({ id: userId });
  if (!user) throw new WingleError('Account not found.');
  return user.wingitsBalance;
}

export async function sendWingle(toUserId: string, note: string, gift?: string) {
  try {
    const session = await getSession();
    if (!session?.userId) throw new WingleError('Unauthorized');
    const userId = session.userId as string;
    if (!toUserId || toUserId === userId || typeof note !== 'string' || note.length > 280) {
      throw new WingleError('Invalid Wingle.');
    }
    const giftMeta = getWingleGift(gift);
    if (gift && !giftMeta) throw new WingleError('Invalid gift.');
    const giftCost = giftMeta?.cost ?? 0;
    const title = giftMeta ? `New Wingle with ${giftMeta.icon} ${giftMeta.label}!` : 'New Wingle!';
    const body = giftMeta ? `Someone sent you a ${giftMeta.label} with their Wingle!` : 'Someone sent you a Wingle. Check it out!';
    const href = '/wingles';

    const { wingleId, createdAt, remainingBalance } = await db.transaction(async (tx) => {
      const user = await tx.orm.public.User.where({ id: userId }).first();
      if (!user) throw new WingleError('Account not found.');
      if (!user.isUnlimited && (!user.verificationSelfie || user.selfieStatus !== 'approved')) {
        throw new WingleError('Complete selfie verification to send Wingles.', 'verification_required');
      }

      const sendCost = user.isUnlimited ? 0 : WINGLE_SEND_COST;
      // Updating the sender first serializes concurrent sends. A duplicate rolls back the debit.
      const remainingBalance = await adjustWingleBalance(tx, userId, -(sendCost + giftCost), user.isUnlimited);
      const existing = await tx.orm.public.Wingle.where({ fromUserId: userId, toUserId }).first();
      if (existing) throw new WingleError('You have already sent this person a Wingle.');

      const wingle = await tx.orm.public.Wingle.create({
        fromUserId: userId,
        toUserId,
        note: giftMeta ? `[GIFT:${gift}] ${note.trim()}` : note.trim(),
      });
      // Record the base charge separately so a decline can refund the actual Wingle charge.
      await tx.orm.public.WingitsTransaction.create({
        id: `wingle-send:${wingle.id}`,
        userId,
        amount: -sendCost,
        type: 'spend',
        description: sendCost ? 'Sent a Wingle' : 'Sent a Wingle (Unlimited access)',
      });
      if (giftCost) {
        await tx.orm.public.WingitsTransaction.create({
          id: crypto.randomUUID(),
          userId,
          amount: -giftCost,
          type: 'spend',
          description: `Sent ${giftMeta?.label} with a Wingle`,
        });
      }
      await tx.orm.public.Notification.create({
        userId: toUserId, type: 'wingle_received', title, body, href,
      });
      return { wingleId: wingle.id, createdAt: wingle.createdAt.toString(), remainingBalance };
    });

    await publishWingleUpdate(toUserId, { title, body, url: href });
    return { ok: true as const, wingleId, createdAt, remainingBalance };
  } catch (err) {
    if (err instanceof WingleError) {
      return { ok: false as const, error: err.message, reason: err.reason };
    }
    console.error('Send Wingle error:', err);
    return { ok: false as const, error: 'Failed to send Wingle.' };
  }
}

async function publishWingleUpdate(userId: string, notification?: { title: string; body: string; url: string }) {
  const tasks: Promise<unknown>[] = [
    import('@/lib/pusher').then(({ pusherServer }) => pusherServer.trigger(`private-user-${userId}`, 'state-changed', {})),
  ];
  if (notification) {
    tasks.push(import('@/app/actions/push').then(({ sendPushNotificationAction }) =>
      sendPushNotificationAction(userId, notification)));
  }
  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === 'rejected') console.error('Wingle notification error:', result.reason);
  }
}

export async function getReceivedWingles() {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const wingles = await db.orm.public.Wingle.where({
      toUserId: session.userId as string,
      status: 'pending'
    }).all()
    
    return { ok: true, data: wingles }
  } catch (err) {
    console.error('Get Wingles error:', err)
    return { ok: false, error: 'Failed to fetch Wingles' }
  }
}

export async function respondToWingle(wingleId: string, accept: boolean) {
  try {
    const session = await getSession();
    if (!session?.userId) throw new WingleError('Unauthorized');
    const userId = session.userId as string;
    const status = accept ? 'accepted' : 'declined';
    const result = await db.transaction(async (tx) => {
      const respondedAt = Temporal.Now.instant();
      const wingle = await tx.orm.public.Wingle.where({ id: wingleId, toUserId: userId, status: 'pending' })
        .update({ status, respondedAt });
      if (!wingle) throw new WingleError('This Wingle has already been answered or is unavailable.');

      if (!accept) {
        const sendCharge = await tx.orm.public.WingitsTransaction
          .where({ id: `wingle-send:${wingle.id}`, userId: wingle.fromUserId }).first();
        // Older Wingles predate per-Wingle ledger entries and retain their original refund.
        const refund = sendCharge ? Math.min(3, -sendCharge.amount) : 3;
        if (refund > 0) {
          await adjustWingleBalance(tx, wingle.fromUserId, refund);
          await tx.orm.public.WingitsTransaction.create({
            id: crypto.randomUUID(),
            userId: wingle.fromUserId,
            amount: refund,
            type: 'refund',
            description: 'Wingle was declined',
          });
        }
        return { senderId: wingle.fromUserId, respondedAt: respondedAt.toString() };
      }

      const receiver = await tx.orm.public.User.where({ id: userId }).first();
      if (!receiver) throw new WingleError('Account not found.');
      const acceptCost = receiver.isUnlimited ? 0 : WINGLE_ACCEPT_COST;
      const remainingBalance = await adjustWingleBalance(tx, userId, -acceptCost, receiver.isUnlimited);
      if (acceptCost) {
        await tx.orm.public.WingitsTransaction.create({
          id: crypto.randomUUID(), userId, amount: -acceptCost, type: 'spend', description: 'Accepted a Wingle',
        });
      }

      const [userId1, userId2] = [wingle.fromUserId, wingle.toUserId].sort();
      const pair = { userId1, userId2 };
      const connection = await tx.orm.public.Connection.where(pair).first()
        ?? await tx.orm.public.Connection.create(pair);
      const conversation = await tx.orm.public.Conversation.where(pair).first()
        ?? await tx.orm.public.Conversation.create(pair);
      const notification = {
        title: 'Wingle Accepted!',
        body: 'Your Wingle was accepted. You can now chat!',
        url: `/mingles/${conversation.id}`,
      };
      await tx.orm.public.Notification.create({
        userId: wingle.fromUserId,
        type: 'wingle_accepted',
        title: notification.title,
        body: notification.body,
        href: notification.url,
      });
      return {
        senderId: wingle.fromUserId,
        respondedAt: respondedAt.toString(),
        remainingBalance,
        connectionId: connection.id,
        conversationId: conversation.id,
        notification,
      };
    });

    await publishWingleUpdate(result.senderId, result.notification);
    return {
      ok: true as const,
      respondedAt: result.respondedAt,
      remainingBalance: result.remainingBalance,
      connectionId: result.connectionId,
      conversationId: result.conversationId,
    };
  } catch (err) {
    if (err instanceof WingleError) return { ok: false as const, error: err.message, reason: err.reason };
    console.error('Respond Wingle error:', err);
    return { ok: false as const, error: 'Failed to respond to Wingle.' };
  }
}

export async function sendSecretWingleAction(
  targetPhone: string,
  message: string,
  options?: {
    recipientName?: string;
    senderName?: string;
    isAnonymous?: boolean;
    language?: 'en' | 'si' | 'ta';
  }
) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };

    if (!targetPhone?.trim() || !message?.trim()) {
      return { ok: false, error: 'Phone number and message are required' };
    }

    const formattedPhone = formatNotifyPhoneNumber(targetPhone);
    if (!formattedPhone || formattedPhone.length < 9) {
      return { ok: false, error: 'Please enter a valid mobile number' };
    }

    const currentUser = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (!currentUser) return { ok: false, error: 'User not found' };

    if (currentUser.phone && formatNotifyPhoneNumber(currentUser.phone) === formattedPhone) {
      return { ok: false, error: 'You cannot send a Secret Wingle to your own phone number!' };
    }

    const SECRET_WINGLE_COST = 20;
    if (currentUser.wingitsBalance < SECRET_WINGLE_COST) {
      return { ok: false, error: 'Insufficient Wingits balance (20 Wingits required)' };
    }

    // Deduct Wingits and save SecretWingle atomically
    const newSecretWingle = await db.transaction(async (tx) => {
      await tx.orm.public.User.where({ id: currentUser.id }).update({
        wingitsBalance: currentUser.wingitsBalance - SECRET_WINGLE_COST
      });

      await tx.orm.public.WingitsTransaction.create({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        amount: -SECRET_WINGLE_COST,
        type: 'spend',
        description: 'Sent a Secret Wingle'
      });

      return await tx.orm.public.SecretWingle.create({
        senderId: currentUser.id,
        targetPhone: formattedPhone,
        message: message.trim()
      });
    });

    // Send SMS via Notify.lk using structured multilingual template
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.winglemingle.com';
    const { buildSecretWingleSms } = await import('@/lib/notify');
    const smsText = buildSecretWingleSms({
      recipientName: options?.recipientName || options?.senderName,
      appUrl
    });

    const smsRes = await sendNotifySms({
      to: formattedPhone,
      message: smsText
    });

    // If the recipient is already registered, send in-app notification & push
    try {
      const phoneVariants = getPhoneVariants(formattedPhone);
      const existingUser = await db.orm.public.User.where(u => u.phone.in(phoneVariants)).first();

      if (existingUser && existingUser.id !== currentUser.id) {
        await db.orm.public.Notification.create({
          userId: existingUser.id,
          type: 'secret_wingle',
          title: 'Secret Wingle Received! 🤫',
          body: 'Someone sent you a Secret Wingle. Check your Secret Wingles tab to see who it is!',
          href: '/secret-wingles'
        });

        const { sendPushNotificationAction } = await import('@/app/actions/push');
        await sendPushNotificationAction(existingUser.id, {
          title: 'Secret Wingle Received! 🤫',
          body: 'Someone sent you a Secret Wingle. Open the app to see it!',
          url: '/secret-wingles'
        });

        const { pusherServer } = await import('@/lib/pusher');
        await pusherServer.trigger(`private-user-${existingUser.id}`, 'state-changed', {});
      }
    } catch (pushErr) {
      console.error('Error notifying existing recipient:', pushErr);
    }

    return {
      ok: true,
      data: {
        ...newSecretWingle,
        createdAt: newSecretWingle.createdAt.toString()
      },
      smsStatus: smsRes.status || (smsRes.simulated ? 'simulated' : 'sent')
    };
  } catch (err: any) {
    console.error('Send Secret Wingle error:', err);
    return { ok: false, error: err?.message || 'Failed to send Secret Wingle' };
  }
}

export async function getReceivedSecretWinglesAction() {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };

    const currentUser = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (!currentUser || !currentUser.phone) {
      return { ok: true, data: [] };
    }

    const phoneVariants = getPhoneVariants(currentUser.phone);
    const secretWingles = await db.orm.public.SecretWingle.where(sw =>
      sw.targetPhone.in(phoneVariants)
    ).all();

    // Mark as unlocked
    for (const sw of secretWingles) {
      if (!sw.unlocked) {
        await db.orm.public.SecretWingle.where({ id: sw.id }).update({ unlocked: true });
      }
    }

    const sendersIds = Array.from(new Set(secretWingles.map(sw => sw.senderId)));
    const senders = sendersIds.length > 0
      ? await db.orm.public.User.where(u => u.id.in(sendersIds)).all()
      : [];
    const validSenders = senders.filter(Boolean);

    // Fetch primary photos of senders
    const senderPhotos = sendersIds.length > 0
      ? await db.orm.public.Photo.where(p => p.userId.in(sendersIds)).all()
      : [];

    const populatedSecretWingles = secretWingles.map(sw => {
      const sender = validSenders.find(s => s && s.id === sw.senderId);
      const primaryPhoto = senderPhotos.find(p => p.userId === sw.senderId && p.isPrimary);

      return {
        ...sw,
        createdAt: sw.createdAt.toString(),
        unlocked: true,
        sender: sender ? {
          id: sender.id,
          name: sender.name,
          age: sender.age,
          gender: sender.gender,
          location: sender.location,
          photo: primaryPhoto?.url || null
        } : null
      };
    });

    return { ok: true, data: populatedSecretWingles };
  } catch (err) {
    console.error('Get Secret Wingles error:', err);
    return { ok: false, error: 'Failed to fetch Secret Wingles' };
  }
}

export async function getSentSecretWinglesAction() {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };

    const sent = await db.orm.public.SecretWingle.where({
      senderId: session.userId as string
    }).all();

    // Sort by createdAt descending
    sent.sort((a, b) => new Date(b.createdAt.toString()).getTime() - new Date(a.createdAt.toString()).getTime());

    return {
      ok: true,
      data: sent.map(sw => ({
        ...sw,
        createdAt: sw.createdAt.toString()
      }))
    };
  } catch (err) {
    console.error('Get Sent Secret Wingles error:', err);
    return { ok: false, error: 'Failed to fetch sent Secret Wingles' };
  }
}

export async function markWinglesViewedAction() {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    // Using raw SQL as bulk update for where + multiple matches is limited in Prisma 8 ORM
    // Or we can just fetch and loop. Let's fetch and update since it's simple.
    const wingles = await db.orm.public.Wingle.where({
      toUserId: session.userId as string,
      status: 'pending'
    }).all()

    for (const w of wingles) {
      if (!w.viewed) {
        await db.orm.public.Wingle.where({ id: w.id }).update({ viewed: true })
      }
    }
    
    return { ok: true }
  } catch (err) {
    console.error('markWinglesViewedAction error:', err)
    return { ok: false, error: 'Failed to mark wingles viewed' }
  }
}
