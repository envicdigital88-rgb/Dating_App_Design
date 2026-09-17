'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { or } from '@prisma/orm-postgres/orm-client'

export async function sendMingleAction(conversationId: string, body: string, imageUrl?: string) {
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

    const mingle = await db.orm.public.Mingle.create({
      id: `mgl_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId,
      body,
      imageUrl: imageUrl || null
    })

    await db.orm.public.Conversation.where({ id: conversationId }).update({
      lastMingleAt: new Date()
    })

    return { 
      ok: true, 
      data: {
        ...mingle,
        createdAt: mingle.createdAt.toString(),
        readAt: mingle.readAt ? mingle.readAt.toString() : null
      } 
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
    await db.orm.public.Mingle
      .where((m) => m.conversationId.eq(conversationId))
      .where((m) => m.senderId.neq(userId))
      .where((m) => m.readAt.isNull())
      .update({ readAt: new Date() })

    return { ok: true }
  } catch (err) {
    console.error('markConversationReadAction error:', err)
    return { ok: false, error: 'Failed to mark as read' }
  }
}

export async function getConversationsAction() {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string

    // Get all conversations where userId1 or userId2 is the current user
    const convs = await db.orm.public.Conversation
      .where((c) => or(c.userId1.eq(userId), c.userId2.eq(userId)))
      .include('mingles')
      .all()

    const formattedConvs = convs.map(c => ({
      id: c.id,
      userIds: [c.userId1, c.userId2],
      createdAt: c.createdAt.toString(),
      lastMingleAt: c.lastMingleAt.toString()
    }))

    const formattedMingles = convs.flatMap(c => c.mingles.map(m => ({
      ...m,
      createdAt: m.createdAt.toString(),
      readAt: m.readAt ? m.readAt.toString() : null
    })))

    return { ok: true, data: { conversations: formattedConvs, mingles: formattedMingles } }
  } catch (err) {
    console.error('getConversationsAction error:', err)
    return { ok: false, error: 'Failed to fetch conversations' }
  }
}
