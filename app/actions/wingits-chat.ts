'use server';

import { and, or } from '@prisma/orm-postgres/orm-client';
import { Temporal } from 'temporal-polyfill';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { lockWingitsWallet, MAX_WINGITS, type WalletTransaction } from '@/lib/wingits-wallet';

class WingitsChatError extends Error {}

async function getChatMembers(tx: WalletTransaction, conversationId: string, userId: string) {
  const unavailable = 'Wingits can only be shared in an active chat.';
  const conversation = await tx.orm.public.Conversation.first({ id: conversationId });
  if (!conversation || (conversation.userId1 !== userId && conversation.userId2 !== userId)) {
    throw new WingitsChatError(unavailable);
  }
  const friendId = conversation.userId1 === userId ? conversation.userId2 : conversation.userId1;
  if (friendId === userId) throw new WingitsChatError(unavailable);

  // Use the same order even when the two members send to each other at the same time.
  for (const id of [userId, friendId].sort()) {
    if (!await lockWingitsWallet(tx, id)) throw new WingitsChatError(unavailable);
  }

  const accounts = await tx.orm.public.User.select(
    'id', 'name', 'isAnonymous', 'anonymousName', 'suspended', 'wingitsBalance'
  ).where(u => u.id.in([userId, friendId])).all();
  const sender = accounts.find(user => user.id === userId);
  const friend = accounts.find(user => user.id === friendId);
  if (!sender || !friend || sender.suspended || friend.suspended) throw new WingitsChatError(unavailable);

  const accepted = await tx.orm.public.Wingle.where({ status: 'accepted' }).where(w => or(
    and(w.fromUserId.eq(userId), w.toUserId.eq(friendId)),
    and(w.fromUserId.eq(friendId), w.toUserId.eq(userId))
  )).first();
  const blocked = await tx.orm.public.Block.where(b => or(
    and(b.blockerId.eq(userId), b.blockedUserId.eq(friendId)),
    and(b.blockerId.eq(friendId), b.blockedUserId.eq(userId))
  )).first();
  if (!accepted || blocked) throw new WingitsChatError(unavailable);

  return { sender, friend, senderName: sender.isAnonymous ? sender.anonymousName || 'Anonymous' : sender.name };
}

async function publishWalletUpdate(userIds: string[]) {
  try {
    const { pusherServer } = await import('@/lib/pusher');
    await pusherServer.trigger(userIds.map(id => `private-user-${id}`), 'state-changed', {});
  } catch {
    console.warn('Could not refresh Wingits activity in real time.');
  }
}

async function shareWingits(mode: 'send' | 'request', conversationId: string, amount: number, operationId: string) {
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_WINGITS) {
    return { ok: false as const, error: 'Enter a positive whole number of Wingits.' };
  }
  if (typeof conversationId !== 'string' || !conversationId || conversationId.length > 128 ||
      typeof operationId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operationId)) {
    return { ok: false as const, error: 'This Wingits action is invalid.' };
  }

  try {
    const session = await getSession();
    if (typeof session?.userId !== 'string' || session.verified === false) {
      return { ok: false as const, error: 'Please sign in to share Wingits.' };
    }
    const userId = session.userId;
    const key = `${userId}:${operationId.toLowerCase()}`;
    const { friendId } = await db.transaction(async tx => {
      const { sender, friend, senderName } = await getChatMembers(tx, conversationId, userId);
      const href = `/mingles/${conversationId}`;
      if (mode === 'request') {
        const id = `wingits-request:${key}`;
        const body = `Requested ${amount} Wingits. Open your chat to respond.`;
        const existing = await tx.orm.public.Notification.first({ id });
        if (existing) {
          if (existing.userId !== friend.id || existing.href !== href || existing.body !== body) {
            throw new WingitsChatError('This request has already been used.');
          }
          return { friendId: friend.id };
        }
        const cutoff = Temporal.Now.instant().subtract({ minutes: 1 });
        const recent = await tx.orm.public.Notification.where({ userId: friend.id, type: 'wingits_request', href })
          .where(n => n.createdAt.gt(cutoff)).first();
        if (recent) throw new WingitsChatError('Please wait a minute before asking this friend again.');
        await tx.orm.public.Notification.create({
          id, userId: friend.id, type: 'wingits_request', href,
          title: `${senderName} asked for Wingits`, body,
        });
        return { friendId: friend.id };
      }

      const debitId = `wingits-sent:${key}`;
      const creditId = `wingits-received:${key}`;
      const existing = await tx.orm.public.WingitsTransaction.first({ id: debitId });
      if (existing) {
        const credit = await tx.orm.public.WingitsTransaction.first({ id: creditId });
        if (existing.amount !== -amount || credit?.userId !== friend.id || credit.amount !== amount) {
          throw new WingitsChatError('This transfer has already been used.');
        }
        return { friendId: friend.id };
      }
      if (sender.wingitsBalance < amount) throw new WingitsChatError('You do not have enough Wingits.');
      if (friend.wingitsBalance > MAX_WINGITS - amount) {
        throw new WingitsChatError('This amount would exceed your friend’s wallet limit.');
      }

      const friendName = friend.isAnonymous ? friend.anonymousName || 'Anonymous' : friend.name;
      await tx.orm.public.User.where({ id: userId }).update({ wingitsBalance: sender.wingitsBalance - amount });
      await tx.orm.public.User.where({ id: friend.id }).update({ wingitsBalance: friend.wingitsBalance + amount });
      await tx.orm.public.WingitsTransaction.create({
        id: debitId, userId, amount: -amount, type: 'transfer_sent', description: `Sent Wingits to ${friendName}`,
      });
      await tx.orm.public.WingitsTransaction.create({
        id: creditId, userId: friend.id, amount, type: 'transfer_received', description: `Received Wingits from ${senderName}`,
      });
      await tx.orm.public.Notification.create({
        userId: friend.id, type: 'wingits_received', href,
        title: 'Wingits received', body: `${senderName} sent you ${amount} Wingits.`,
      });
      return { friendId: friend.id };
    });

    await publishWalletUpdate(mode === 'send' ? [userId, friendId] : [friendId]);
    return { ok: true as const };
  } catch (error) {
    if (error instanceof WingitsChatError) return { ok: false as const, error: error.message };
    console.error('Could not complete Wingits chat action.');
    return { ok: false as const, error: 'Could not confirm this action. Please try again.' };
  }
}

export async function sendWingitsToChatMemberAction(conversationId: string, amount: number, operationId: string) {
  return shareWingits('send', conversationId, amount, operationId);
}

export async function requestWingitsFromChatMemberAction(conversationId: string, amount: number, operationId: string) {
  return shareWingits('request', conversationId, amount, operationId);
}
