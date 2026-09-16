'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function sendWingle(toUserId: string, note: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    // Check if Wingle already exists
    const existing = await db.orm.public.Wingle.where({
      fromUserId: session.userId as string,
      toUserId: toUserId
    }).first()
    
    if (existing) {
      return { ok: false, error: 'Wingle already sent' }
    }

    await db.orm.public.Wingle.create({
      fromUserId: session.userId as string,
      toUserId: toUserId,
      note: note
    })

    return { ok: true }
  } catch (err) {
    console.error('Send Wingle error:', err)
    return { ok: false, error: 'Failed to send Wingle' }
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
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const wingle = await db.orm.public.Wingle.where({ id: wingleId }).first()
    if (!wingle || wingle.toUserId !== session.userId) {
      return { ok: false, error: 'Invalid Wingle' }
    }

    const newStatus = accept ? 'accepted' : 'declined'

    // Update Wingle
    await db.orm.public.Wingle.where({ id: wingleId }).update({
      status: newStatus,
      respondedAt: new Date()
    })

    // If accepted, create a Connection and Conversation
    if (accept) {
      await db.orm.public.Connection.create({
        userId1: wingle.fromUserId,
        userId2: wingle.toUserId
      })
      await db.orm.public.Conversation.create({
        userId1: wingle.fromUserId,
        userId2: wingle.toUserId
      })
    }

    return { ok: true }
  } catch (err) {
    console.error('Respond Wingle error:', err)
    return { ok: false, error: 'Failed to respond to Wingle' }
  }
}
