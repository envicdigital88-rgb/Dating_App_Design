'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { Temporal } from 'temporal-polyfill'
import { and, or } from '@prisma/orm-postgres/orm-client'
import { lockWingitsWallet } from '@/lib/wingits-wallet'
import { chatImageSendCost, chatImageViewCost, type ChatImageViewResult } from '@/lib/chat-images'

class ImageSendError extends Error {}

export async function sendMingleAction(conversationId: string, body: string, imageUrl?: string, replyToId?: string | null, forwarded?: boolean, viewOnce?: boolean, clientId?: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const senderId = session.userId as string

    // Ensure conversation exists in DB (could be from mock DB initially)
    const conv = await db.orm.public.Conversation.where({ id: conversationId }).first()
    if (!conv) {
      console.warn(`Conversation ${conversationId} not found in DB. Skip sending mingle to DB.`)
      return { ok: false, error: 'Conversation not found' }
    }
    if (conv.userId1 !== senderId && conv.userId2 !== senderId) {
      return { ok: false, error: 'Conversation not found' }
    }

    const otherId = conv.userId1 === senderId ? conv.userId2 : conv.userId1
    const acceptedWingle = await db.orm.public.Wingle.where({ status: 'accepted' })
      .where(w => or(
        and(w.fromUserId.eq(senderId), w.toUserId.eq(otherId)),
        and(w.fromUserId.eq(otherId), w.toUserId.eq(senderId))
      )).first();
    if (!acceptedWingle) {
      return { ok: false, error: 'Accept a Wingle to start chatting.' }
    }
    if (otherId) {
      const blocked = await db.orm.public.Block.where((b) => 
        or(
          and(b.blockerId.eq(senderId), b.blockedUserId.eq(otherId)),
          and(b.blockerId.eq(otherId), b.blockedUserId.eq(senderId))
        )
      ).first()
      if (blocked) {
        return { ok: false, error: 'Cannot send message to this user' }
      }
    }

    const data: any = {
      conversationId,
      senderId,
      body,
      imageUrl: imageUrl || null,
      replyToId: replyToId || null,
      forwarded: forwarded || false,
      viewOnce: viewOnce || false
    }
    if (clientId) data.id = clientId;

    const { mingle, remainingBalance } = await db.transaction(async (tx) => {
      let remainingBalance: number | undefined;
      if (imageUrl) {
        if (!await lockWingitsWallet(tx, senderId)) throw new ImageSendError('Account not found');
        const sender = await tx.orm.public.User.select('wingitsBalance', 'isUnlimited').first({ id: senderId });
        if (!sender) throw new ImageSendError('Account not found');
        const cost = chatImageSendCost(sender);
        if (sender.wingitsBalance < cost) {
          throw new ImageSendError(`You need ${cost} Wingits to send a photo.`);
        }
        remainingBalance = sender.wingitsBalance - cost;
        if (cost > 0) {
          await tx.orm.public.User.where({ id: senderId }).update({ wingitsBalance: remainingBalance });
          await tx.orm.public.WingitsTransaction.create({
            userId: senderId,
            amount: -cost,
            type: 'spend',
            description: 'Sent an image in chat'
          });
        }
      }
      const mingle = await tx.orm.public.Mingle.create(data);
      await tx.orm.public.Conversation.where({ id: conversationId }).update({
        lastMingleAt: Temporal.Now.instant()
      });
      return { mingle, remainingBalance };
    });

    const formattedMingle = {
      ...mingle,
      createdAt: mingle.createdAt.toString(),
      readAt: mingle.readAt ? mingle.readAt.toString() : null,
      deliveredAt: mingle.deliveredAt ? mingle.deliveredAt.toString() : null,
      reactions: mingle.reactions ? (mingle.reactions as any) : null
    };

    if (otherId) {
      try {
        const { pusherServer } = await import('@/lib/pusher');
        // Omit imageUrl from pusher payload to avoid exceeding the 10KB limit
        const { imageUrl: _discard, ...pusherPayload } = formattedMingle;
        await pusherServer.trigger(`private-user-${otherId}`, 'new-mingle', pusherPayload);
      } catch (err) {
        console.error('Message notification error:', err);
      }
      
      try {
        const { sendPushNotificationAction } = await import('@/app/actions/push');
        await sendPushNotificationAction(otherId, {
          title: 'New Message',
          body: body ? body : (imageUrl ? 'Sent an image' : 'New message'),
          url: `/mingles/${conversationId}`
        });
      } catch (err) {
        console.error('Push error:', err);
      }
    }

    return { 
      ok: true, 
      data: formattedMingle,
      remainingBalance,
    }
  } catch (err) {
    if (err instanceof ImageSendError) return { ok: false, error: err.message };
    console.error('sendMingleAction error:', err)
    return { ok: false, error: 'Failed to send message' }
  }
}

export async function markConversationReadAction(conversationId: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string

    // Mark mingles where sender is NOT the current user as read
    await db.orm.public.Mingle.where((m) =>
      and(m.conversationId.eq(conversationId), m.senderId.neq(userId), m.readAt.isNull())
    ).update({ readAt: Temporal.Now.instant() })

    const conv = await db.orm.public.Conversation.where({ id: conversationId }).first();
    if (conv) {
      const otherId = conv.userId1 === userId ? conv.userId2 : conv.userId1;
      const { pusherServer } = await import('@/lib/pusher');
      await pusherServer.trigger(`private-user-${otherId}`, 'state-changed', {}).catch(console.error);
    }

    return { ok: true }
  } catch (err) {
    console.error('markConversationReadAction error:', err)
    return { ok: false, error: 'Failed to mark as read' }
  }
}

export async function markMingleDeliveredAction(mingleIds: string[]) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    if (mingleIds.length === 0) return { ok: true }

    await db.orm.public.Mingle.where((m) =>
      and(m.id.in(mingleIds), m.deliveredAt.isNull())
    ).update({ deliveredAt: Temporal.Now.instant() })

    return { ok: true }
  } catch (err) {
    console.error('markMingleDeliveredAction error:', err)
    return { ok: false, error: 'Failed to mark as delivered' }
  }
}

export async function reactToMingleAction(mingleId: string, reactions: any) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string

    const mingle = await db.orm.public.Mingle.where({ id: mingleId }).first()
    if (!mingle) return { ok: false, error: 'Mingle not found' }

    await db.orm.public.Mingle.where({ id: mingleId }).update({ reactions })

    const conv = await db.orm.public.Conversation.where({ id: mingle.conversationId }).first()
    if (conv) {
      const otherId = conv.userId1 === userId ? conv.userId2 : conv.userId1;
      const { pusherServer } = await import('@/lib/pusher');
      await pusherServer.trigger(`private-user-${otherId}`, 'state-changed', {}).catch(console.error);
    }

    return { ok: true }
  } catch (err) {
    console.error('reactToMingleAction error:', err)
    return { ok: false, error: 'Failed to react' }
  }
}

export async function deleteMingleAction(mingleId: string, type: 'me' | 'everyone') {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string

    const mingle = await db.orm.public.Mingle.where({ id: mingleId }).first()
    if (!mingle) {
      return { ok: false, error: 'Mingle not found' }
    }

    if (type === 'everyone') {
      if (mingle.senderId !== userId) {
        return { ok: false, error: 'Cannot delete this message for everyone' }
      }
      await db.orm.public.Mingle.where({ id: mingleId }).update({
        deleted: true,
        body: '',
        imageUrl: null,
        reactions: null
      })
    } else {
      // Delete for me
      const deletedFor = mingle.deletedFor ? (mingle.deletedFor as string[]) : [];
      if (!deletedFor.includes(userId)) {
        await db.orm.public.Mingle.where({ id: mingleId }).update({
          deletedFor: [...deletedFor, userId]
        })
      }
    }

    const conv = await db.orm.public.Conversation.where({ id: mingle.conversationId }).first();
    if (conv) {
      const otherId = conv.userId1 === userId ? conv.userId2 : conv.userId1;
      const { pusherServer } = await import('@/lib/pusher');
      await pusherServer.trigger(`private-user-${otherId}`, 'state-changed', {}).catch(console.error);
    }

    return { ok: true }
  } catch (err) {
    console.error('deleteMingleAction error:', err)
    return { ok: false, error: 'Failed to delete' }
  }
}

export async function getConversationsAction() {
  console.log('getConversationsAction START');
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string

    const [accepted, blocks] = await Promise.all([
      db.orm.public.Wingle.where({ status: 'accepted' })
        .where(w => or(w.fromUserId.eq(userId), w.toUserId.eq(userId)))
        .select('fromUserId', 'toUserId').all(),
      db.orm.public.Block.where(b => or(b.blockerId.eq(userId), b.blockedUserId.eq(userId)))
        .select('blockerId', 'blockedUserId').all(),
    ]);
    const blockedPeers = new Set(blocks.map(b => b.blockerId === userId ? b.blockedUserId : b.blockerId));
    const peerIds = [...new Set(accepted.map(w => w.fromUserId === userId ? w.toUserId : w.fromUserId))]
      .filter(peerId => !blockedPeers.has(peerId));
    if (peerIds.length === 0) return { ok: true, data: { conversations: [], mingles: [] } };
    const convs = await db.orm.public.Conversation.where(c => or(
      and(c.userId1.eq(userId), c.userId2.in(peerIds)),
      and(c.userId2.eq(userId), c.userId1.in(peerIds))
    )).all();
    const convIds = convs.map(c => c.id);
    
    let allMingles: any[] = [];
    if (convIds.length > 0) {
      allMingles = await db.orm.public.Mingle.where((m) => m.conversationId.in(convIds)).all();
    }

    const formattedConvs = convs.map(c => ({
      id: c.id,
      userIds: [c.userId1, c.userId2],
      createdAt: c.createdAt.toString(),
      lastMingleAt: c.lastMingleAt.toString()
    }));

    const formattedMingles = allMingles
      .filter(m => {
        const deletedFor = m.deletedFor ? (m.deletedFor as string[]) : [];
        if (m.viewOnce) return true;
        return !deletedFor.includes(userId);
      })
      .map(m => ({
        ...m,
        createdAt: m.createdAt.toString(),
        readAt: m.readAt ? m.readAt.toString() : null,
        deliveredAt: m.deliveredAt ? m.deliveredAt.toString() : null,
        reactions: m.reactions ? (m.reactions as any) : null,
        deletedFor: m.deletedFor ? (m.deletedFor as string[]) : [],
        viewOnce: m.viewOnce,
        imageViewCount: m.imageViewCount
      }))

    return { ok: true, data: { conversations: formattedConvs, mingles: formattedMingles } }
  } catch (err) {
    console.error('getConversationsAction error:', err)
    return { ok: false, error: 'Failed to fetch conversations' }
  }
}

class ImageViewError extends Error {
  constructor(message: string, readonly reason?: 'insufficient_wingits' | 'price_changed') {
    super(message);
  }
}

export async function viewImageAction(mingleId: string, expectedCost: number): Promise<ChatImageViewResult> {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string

    const result = await db.transaction(async (tx) => {
      // Serialize all views, including free views, before reading the view count.
      if (!await lockWingitsWallet(tx, userId)) throw new ImageViewError('Account not found');
      const mingle = await tx.orm.public.Mingle.where({ id: mingleId }).first();
      if (!mingle || !mingle.imageUrl || mingle.deleted || mingle.deletedFor.includes(userId)) {
        throw new ImageViewError('Image is unavailable');
      }
      const conv = await tx.orm.public.Conversation.where({ id: mingle.conversationId }).first();
      if (!conv || (conv.userId1 !== userId && conv.userId2 !== userId)) {
        throw new ImageViewError('Image is unavailable');
      }
      const user = await tx.orm.public.User.select('wingitsBalance', 'isUnlimited').first({ id: userId });
      if (!user) throw new ImageViewError('Account not found');

      if (mingle.senderId === userId) {
        return { data: { imageUrl: mingle.imageUrl, imageViewCount: mingle.imageViewCount,
          charged: 0, remainingBalance: user.wingitsBalance }, otherId: null };
      }
      if (mingle.viewOnce && mingle.imageViewCount > 0) throw new ImageViewError('Image has expired');

      const cost = chatImageViewCost(mingle, user);
      if (cost !== expectedCost) {
        throw new ImageViewError('The photo viewing cost has changed. Please try again.', 'price_changed');
      }
      if (user.wingitsBalance < cost) {
        throw new ImageViewError('You need 4 Wingits to view this photo.', 'insufficient_wingits');
      }
      const remainingBalance = user.wingitsBalance - cost;
      if (cost > 0) {
        await tx.orm.public.User.where({ id: userId }).update({ wingitsBalance: remainingBalance });
        await tx.orm.public.WingitsTransaction.create({
          userId, amount: -cost, type: 'spend',
          description: mingle.viewOnce ? 'Viewed a one-view image' : 'Viewed image again',
        });
      }
      const imageViewCount = mingle.imageViewCount + 1;
      await tx.orm.public.Mingle.where({ id: mingleId }).update({
        imageViewCount,
      });
      return { data: { imageUrl: mingle.imageUrl, imageViewCount, charged: cost, remainingBalance },
        otherId: conv.userId1 === userId ? conv.userId2 : conv.userId1 };
    });

    try {
      const { pusherServer } = await import('@/lib/pusher');
      await Promise.all([userId, result.otherId].filter(Boolean).map(id =>
        pusherServer.trigger(`private-user-${id}`, 'state-changed', {})));
    } catch (err) {
      console.error('Image view notification error:', err);
    }

    return { ok: true, data: result.data }
  } catch (err) {
    if (err instanceof ImageViewError) return { ok: false, error: err.message, reason: err.reason };
    console.error('viewImageAction error:', err)
    return { ok: false, error: 'Failed to view image' }
  }
}

