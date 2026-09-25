'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { Temporal } from 'temporal-polyfill'
import { and, or } from '@prisma/orm-postgres/orm-client'

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

    const otherId = conv.userId1 === senderId ? conv.userId2 : conv.userId1
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

    const mingle = await db.orm.public.Mingle.create(data)

    await db.orm.public.Conversation.where({ id: conversationId }).update({
      lastMingleAt: Temporal.Now.instant()
    })

    const formattedMingle = {
      ...mingle,
      createdAt: mingle.createdAt.toString(),
      readAt: mingle.readAt ? mingle.readAt.toString() : null,
      deliveredAt: mingle.deliveredAt ? mingle.deliveredAt.toString() : null,
      reactions: mingle.reactions ? (mingle.reactions as any) : null
    };

    if (otherId) {
      const { pusherServer } = await import('@/lib/pusher');
      await pusherServer.trigger(`private-user-${otherId}`, 'new-mingle', formattedMingle).catch(console.error);
    }

    return { 
      ok: true, 
      data: formattedMingle
    }
  } catch (err) {
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

    await db.orm.public.Mingle.where({ id: mingleId }).update({ reactions })

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
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string

    // Get all conversations where userId1 or userId2 is the current user
    const convs = await db.orm.public.Conversation.where(c => or(c.userId1.eq(userId), c.userId2.eq(userId))).all();
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
        viewOnce: m.viewOnce
      }))

    return { ok: true, data: { conversations: formattedConvs, mingles: formattedMingles } }
  } catch (err) {
    console.error('getConversationsAction error:', err)
    return { ok: false, error: 'Failed to fetch conversations' }
  }
}
