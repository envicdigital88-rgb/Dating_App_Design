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
          userId1: u1,
          userId2: u2,
        })
      }

      let conversation = await db.orm.public.Conversation.where({ userId1: u1, userId2: u2 }).first()
      if (!conversation) {
        conversation = await db.orm.public.Conversation.create({
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

    const { pusherServer } = await import('@/lib/pusher');
    await pusherServer.trigger(`private-user-${targetUserId}`, 'state-changed', {}).catch(console.error);

    return { ok: true, matched: false }
  } catch (err) {
    console.error('likeUser error:', err)
    return { ok: false, error: 'Failed to process like' }
  }
}

export async function unlikeUserAction(targetUserId: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const userId = session.userId as string

    const existingLike = await db.orm.public.Like.where({ fromUserId: userId, toUserId: targetUserId }).first()
    if (!existingLike) {
      return { ok: false, error: 'Not liked' }
    }

    await db.orm.public.Like.where({ id: existingLike.id }).delete()

    const { pusherServer } = await import('@/lib/pusher');
    await pusherServer.trigger(`private-user-${targetUserId}`, 'state-changed', {}).catch(console.error);

    // We keep the connections/conversations intact in case they had a match, but we could also delete them if we wanted to fully "unmatch"
    // For now, unlike just removes the like record.

    return { ok: true }
  } catch (err) {
    console.error('unlikeUser error:', err)
    return { ok: false, error: 'Failed to process unlike' }
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

    const { pusherServer } = await import('@/lib/pusher');
    await pusherServer.trigger(`private-user-${targetUserId}`, 'state-changed', {}).catch(console.error);

    return { ok: true }
  } catch (err) {
    console.error('passUser error:', err)
    return { ok: false, error: 'Failed to process pass' }
  }
}

export async function addToHeartBucketAction(targetUserId: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const userId = session.userId as string

    if (userId === targetUserId) {
      return { ok: false, error: 'Cannot add yourself' }
    }

    const existing = await db.orm.public.HeartBucket.where({ userId, targetUserId }).first()
    if (existing) {
      return { ok: false, error: 'Already in Heart Bucket' }
    }

    await db.orm.public.HeartBucket.create({
      id: `hb_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      targetUserId,
    })

    const { pusherServer } = await import('@/lib/pusher');
    await pusherServer.trigger(`private-user-${targetUserId}`, 'state-changed', {}).catch(console.error);

    return { ok: true }
  } catch (err) {
    console.error('addToHeartBucketAction error:', err)
    return { ok: false, error: 'Failed to add to heart bucket' }
  }
}

export async function getHeartReactsCountAction(userIds: string[]) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const allReacts = await db.orm.public.HeartBucket
      .where((h) => h.targetUserId.in(userIds))
      .all();
    
    // Aggregate manually in JS to avoid Prisma 8 complex aggregates
    const counts = allReacts.reduce((acc, h) => {
      acc[h.targetUserId] = (acc[h.targetUserId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result = userIds.reduce((acc, id) => {
      acc[id] = counts[id] || 0;
      return acc;
    }, {} as Record<string, number>);

    return { ok: true, data: result }
  } catch (err) {
    console.error('getHeartReactsCountAction error:', err)
    return { ok: false, error: 'Failed to get heart reacts count' }
  }
}

export async function removeFromHeartBucketAction(targetUserId: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string

    const existing = await db.orm.public.HeartBucket.where({ userId, targetUserId }).first()
    if (existing) {
      await db.orm.public.HeartBucket.where({ id: existing.id }).delete()
    }
    return { ok: true }
  } catch (err) {
    console.error('removeFromHeartBucketAction error:', err)
    return { ok: false, error: 'Failed to remove from heart bucket' }
  }
}

export async function removeFromPassesAction(targetUserId: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string

    const existing = await db.orm.public.Pass.where({ userId, targetUserId }).first()
    if (existing) {
      await db.orm.public.Pass.where({ id: existing.id }).delete()
    }
    return { ok: true }
  } catch (err) {
    console.error('removeFromPassesAction error:', err)
    return { ok: false, error: 'Failed to remove from passes' }
  }
}
