'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { Temporal } from 'temporal-polyfill'
import { and, or } from '@prisma/orm-postgres/orm-client'
import { buildSecretWingleSms, formatNotifyPhoneNumber, getPhoneVariants, sendNotifySms, validatePhoneNumber } from '@/lib/notify'

import { getWingleGift, SECRET_WINGLE_SEND_COST, WINGLE_ACCEPT_COST, WINGLE_SEND_COST } from '@/lib/wingle-pricing'
import { lockWingitsWallet } from '@/lib/wingits-wallet'

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

export async function sendSecretWingleAction(targetPhone: string, message: string, operationId: string, recipientName?: string) {
  try {
    const session = await getSession();
    if (typeof session?.userId !== 'string' || session.verified === false) {
      return { ok: false as const, error: 'Please sign in to send a Secret Wingle.' };
    }
    if (typeof targetPhone !== 'string' || targetPhone.length > 40 || typeof message !== 'string' ||
        !message.trim() || message.trim().length > 250 || typeof operationId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operationId) ||
        (recipientName !== undefined && (typeof recipientName !== 'string' || recipientName.trim().length > 30))) {
      return { ok: false as const, error: 'Enter a mobile number and a message of up to 250 characters.' };
    }

    const phone = validatePhoneNumber(targetPhone);
    if (!phone.valid) return { ok: false as const, error: phone.error || 'Enter a valid mobile number.' };
    const userId = session.userId;
    const note = message.trim();
    const id = 'secret-wingle:' + userId + ':' + operationId.toLowerCase();
    const refundId = 'secret-wingle-refund:' + id;
    const notice = {
      type: 'secret_wingle',
      title: 'Secret Wingle received',
      body: 'Someone sent you a Secret Wingle. Open Secret Wingles to see it.',
      href: '/secret-wingles',
    };
    const saved = await db.transaction(async tx => {
      if (!await lockWingitsWallet(tx, userId)) throw new WingleError('Account not found.');
      const sender = await tx.orm.public.User.select('phone', 'suspended', 'wingitsBalance').first({ id: userId });
      if (!sender || sender.suspended) throw new WingleError('This account cannot send Secret Wingles.');
      if (sender.phone && formatNotifyPhoneNumber(sender.phone) === phone.formatted) {
        throw new WingleError('You cannot send a Secret Wingle to your own phone number.');
      }

      const existing = await tx.orm.public.SecretWingle.first({ id });
      if (existing) {
        if (existing.targetPhone !== phone.formatted || existing.message !== note) {
          throw new WingleError('This send was already used for a different Secret Wingle.');
        }
        return { duplicate: true, recipientId: null };
      }
      if (await tx.orm.public.WingitsTransaction.first({ id: refundId })) {
        return { duplicate: false, refunded: true as const, recipientId: null };
      }
      if (sender.wingitsBalance < SECRET_WINGLE_SEND_COST) {
        throw new WingleError('You need ' + SECRET_WINGLE_SEND_COST + ' Wingits to send a Secret Wingle.', 'insufficient_wingits');
      }

      const recipient = await tx.orm.public.User.select('id', 'suspended')
        .where(u => u.phone.in(getPhoneVariants(phone.formatted))).first();
      if (recipient) {
        const blocked = await tx.orm.public.Block.where(b => or(
          and(b.blockerId.eq(userId), b.blockedUserId.eq(recipient.id)),
          and(b.blockerId.eq(recipient.id), b.blockedUserId.eq(userId))
        )).first();
        if (recipient.id === userId || recipient.suspended || blocked) throw new WingleError('This recipient is unavailable.');
      }

      await adjustWingleBalance(tx, userId, -SECRET_WINGLE_SEND_COST);
      await tx.orm.public.SecretWingle.create({ id, senderId: userId, targetPhone: phone.formatted, message: note });
      await tx.orm.public.WingitsTransaction.create({
        id, userId, amount: -SECRET_WINGLE_SEND_COST, type: 'spend', description: 'Sent a Secret Wingle',
      });
      if (recipient) await tx.orm.public.Notification.create({ ...notice, userId: recipient.id });
      return { duplicate: false, recipientId: recipient?.id ?? null };
    });

    if (saved.refunded) return { ok: false as const, refunded: true, error: 'SMS could not be sent. Your Wingits were returned.' };
    if (saved.duplicate) return { ok: true as const, delivery: 'saved' as const };
    const sms = await sendNotifySms({
      to: phone.formatted,
      message: buildSecretWingleSms({ recipientName: recipientName?.trim(), appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://www.winglemingle.com' }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => ({ ok: false }));

    if (saved.recipientId) {
      const recipientId = saved.recipientId;
      await Promise.allSettled([
        import('@/lib/pusher').then(({ pusherServer }) => pusherServer.trigger('private-user-' + recipientId, 'secret-wingle-received', {})),
        import('@/app/actions/push').then(({ sendPushNotificationAction }) => sendPushNotificationAction(recipientId, {
          title: notice.title, body: notice.body, url: notice.href,
        })),
      ]);
      return { ok: true as const, delivery: sms.ok ? 'sms' as const : 'in_app' as const };
    }
    if (sms.ok) return { ok: true as const, delivery: 'sms' as const };

    await db.transaction(async tx => {
      await adjustWingleBalance(tx, userId, SECRET_WINGLE_SEND_COST);
      await tx.orm.public.SecretWingle.where({ id }).delete();
      await tx.orm.public.WingitsTransaction.create({
        id: refundId, userId, amount: SECRET_WINGLE_SEND_COST, type: 'refund', description: 'Secret Wingle SMS could not be sent',
      });
    });
    return { ok: false as const, refunded: true, error: 'SMS could not be sent. Your Wingits were returned.' };
  } catch (error) {
    if (error instanceof WingleError) return { ok: false as const, error: error.message, reason: error.reason };
    console.error('Could not complete Secret Wingle send.');
    return { ok: false as const, error: 'Could not confirm this Secret Wingle. Please try again.' };
  }
}

export async function getReceivedSecretWinglesAction() {
  try {
    const session = await getSession();
    if (typeof session?.userId !== 'string') return { ok: false as const, error: 'Unauthorized' };
    const userId = session.userId;
    const currentUser = await db.orm.public.User.select('phone', 'suspended').first({ id: userId });
    if (!currentUser || currentUser.suspended) return { ok: false as const, error: 'Unauthorized' };
    const phones = getPhoneVariants(currentUser.phone);
    if (!phones.length) return { ok: true as const, userId, data: [] };

    const [secretWingles, blocks] = await Promise.all([
      db.orm.public.SecretWingle.where(sw => sw.targetPhone.in(phones)).all(),
      db.orm.public.Block.where(b => or(b.blockerId.eq(userId), b.blockedUserId.eq(userId)))
        .select('blockerId', 'blockedUserId').all(),
    ]);
    const blocked = new Set(blocks.map(b => b.blockerId === userId ? b.blockedUserId : b.blockerId));
    const senderIds = [...new Set(secretWingles.map(sw => sw.senderId))].filter(id => !blocked.has(id));
    if (!senderIds.length) return { ok: true as const, userId, data: [] };

    const senders = await db.orm.public.User
      .select('id', 'name', 'age', 'gender', 'location', 'isAnonymous', 'anonymousName')
      .where({ suspended: false, role: 'member' }).where(u => u.id.in(senderIds)).all();
    const senderById = new Map(senders.map(sender => [sender.id, sender]));
    const visible = secretWingles.filter(sw => senderById.has(sw.senderId));
    const photoIds = senders.filter(sender => !sender.isAnonymous).map(sender => sender.id);
    const unlockIds = visible.filter(sw => !sw.unlocked).map(sw => sw.id);
    const [photos] = await Promise.all([
      photoIds.length ? db.orm.public.Photo.select('id', 'userId', 'url')
        .where({ isPrimary: true, moderation: 'approved' }).where(p => p.userId.in(photoIds)).all() : [],
      unlockIds.length ? db.runtime().execute(db.sql.public.secretWingle.update({ unlocked: true })
        .where((fields, fns) => fns.in(fields.id, unlockIds)).build()) : null,
    ]);
    const photoBySender = new Map(photos.map(photo => [photo.userId, photo]));

    const data = visible.sort((a, b) => Temporal.Instant.compare(b.createdAt, a.createdAt)).map(sw => {
      const sender = senderById.get(sw.senderId)!;
      const photo = photoBySender.get(sw.senderId);
      return {
        id: sw.id,
        senderId: sw.senderId,
        message: sw.message,
        createdAt: sw.createdAt.toString(),
        unlocked: true,
        sender: {
          id: sender.id,
          name: sender.isAnonymous ? sender.anonymousName || 'Anonymous' : sender.name,
          age: sender.isAnonymous ? 0 : sender.age,
          gender: sender.isAnonymous ? '' : sender.gender,
          location: sender.isAnonymous ? 'Hidden' : sender.location,
          photo: photo ? (photo.url.startsWith('data:') ? `/api/photo/${photo.id}` : photo.url) : null,
        },
      };
    });
    return { ok: true as const, userId, data };
  } catch (err) {
    console.error('Get Secret Wingles error:', err);
    return { ok: false as const, error: 'Failed to fetch Secret Wingles' };
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
