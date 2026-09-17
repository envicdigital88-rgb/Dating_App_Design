'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function likeUser(targetUserId: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const userId = session.userId as string

    // Prevent self-liking
    if (userId === targetUserId) {
      return { ok: false, error: 'Cannot like yourself' }
    }

    // Check if already liked or passed
    const existingLike = await db.orm.public.Like.where({ fromUserId: userId, toUserId: targetUserId }).first()
    if (existingLike) {
      return { ok: false, error: 'Already liked this user' }
    }

    const existingPass = await db.orm.public.Pass.where({ userId, targetUserId }).first()
    if (existingPass) {
      return { ok: false, error: 'Already passed this user' }
    }

    // Create the Like
    await db.orm.public.Like.create({
      id: `lk_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId: userId,
      toUserId: targetUserId,
    })

    // Check for mutual like (did the target user already like this user?)
    const mutualLike = await db.orm.public.Like.where({ fromUserId: targetUserId, toUserId: userId }).first()

    if (mutualLike) {
      // It's a match! Create Connection and Conversation
      // Ensure userId1 < userId2 for consistency in Connections/Conversations
      const [u1, u2] = userId < targetUserId ? [userId, targetUserId] : [targetUserId, userId]

      // Check if connection already exists to prevent duplicates
      let connection = await db.orm.public.Connection.where({ userId1: u1, userId2: u2 }).first()
      if (!connection) {
        connection = await db.orm.public.Connection.create({
          id: `conn_${Math.random().toString(36).substr(2, 9)}`,
          userId1: u1,
          userId2: u2,
        })
      }

      let conversation = await db.orm.public.Conversation.where({ userId1: u1, userId2: u2 }).first()
      if (!conversation) {
        conversation = await db.orm.public.Conversation.create({
          id: `conv_${Math.random().toString(36).substr(2, 9)}`,
          userId1: u1,
          userId2: u2,
        })
      }

      // In the future, create Notification for mutual match here

      return { 
        ok: true, 
        matched: true, 
        connectionId: connection.id, 
        conversationId: conversation.id 
      }
    }

    return { ok: true, matched: false }
  } catch (err) {
    console.error('likeUser error:', err)
    return { ok: false, error: 'Failed to process like' }
  }
}

export async function passUser(targetUserId: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const userId = session.userId as string

    // Prevent self-passing
    if (userId === targetUserId) {
      return { ok: false, error: 'Cannot pass yourself' }
    }

    // Check if already passed or liked
    const existingPass = await db.orm.public.Pass.where({ userId, targetUserId }).first()
    if (existingPass) {
      return { ok: false, error: 'Already passed this user' }
    }

    const existingLike = await db.orm.public.Like.where({ fromUserId: userId, toUserId: targetUserId }).first()
    if (existingLike) {
      return { ok: false, error: 'Already liked this user' }
    }

    // Create the Pass
    await db.orm.public.Pass.create({
      id: `pass_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      targetUserId,
    })

    return { ok: true }
  } catch (err) {
    console.error('passUser error:', err)
    return { ok: false, error: 'Failed to process pass' }
  }
}
