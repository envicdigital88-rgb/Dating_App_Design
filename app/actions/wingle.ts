'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { Temporal } from 'temporal-polyfill'

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

    const newWingle = await db.orm.public.Wingle.create({
      fromUserId: session.userId as string,
      toUserId: toUserId,
      note: note
    })

    return { ok: true, wingleId: newWingle.id }
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

    const logMsg = `[respondToWingle] wingleId: ${wingleId}, accept: ${accept}, session: ${session.userId}, toUserId: ${wingle.toUserId}\n`;
    console.log(logMsg);
    try { require('fs').appendFileSync('d:/Dating_App_Design/logs.txt', logMsg); } catch(e) {}

    // Update Wingle
    await db.orm.public.Wingle.where({ id: wingleId }).update({
      status: newStatus,
      respondedAt: Temporal.Now.instant()
    })
    console.log(`[respondToWingle] Wingle status updated to ${newStatus}`);

    // If accepted, create a Connection and Conversation
    if (accept) {
      const u1 = wingle.fromUserId < wingle.toUserId ? wingle.fromUserId : wingle.toUserId
      const u2 = wingle.fromUserId < wingle.toUserId ? wingle.toUserId : wingle.fromUserId

      let connection = await db.orm.public.Connection.where({ userId1: u1, userId2: u2 }).first()
      if (!connection) {
        connection = await db.orm.public.Connection.create({
          userId1: u1,
          userId2: u2
        })
      }

      let conversation = await db.orm.public.Conversation.where({ userId1: u1, userId2: u2 }).first()
      if (!conversation) {
        conversation = await db.orm.public.Conversation.create({
          userId1: u1,
          userId2: u2
        })
      }

      console.log(`[respondToWingle] Created Connection ${connection.id} and Conversation ${conversation.id}`);
      return { ok: true, connectionId: connection.id, conversationId: conversation.id }
    }

    return { ok: true }
  } catch (err) {
    const errMsg = `Respond Wingle error: ${err}\n`;
    console.error(errMsg)
    try { require('fs').appendFileSync('d:/Dating_App_Design/logs.txt', errMsg); } catch(e) {}
    return { ok: false, error: 'Failed to respond to Wingle' }
  }
}

export async function sendSecretWingleAction(targetPhone: string, message: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    if (!targetPhone || !message) {
      return { ok: false, error: 'Phone number and message are required' }
    }

    const newSecretWingle = await db.orm.public.SecretWingle.create({
      senderId: session.userId as string,
      targetPhone: targetPhone,
      message: message
    })

    // Simulate sending SMS and WhatsApp
    console.log(`[SIMULATED TWILIO API] SMS sent to ${targetPhone}: "Someone has a secret crush on you! They sent you a message on WingleMingle: '${message}'. Sign up to see who it is!"`);
    console.log(`[SIMULATED WHATSAPP API] WhatsApp sent to ${targetPhone}: "Someone has a secret crush on you! They sent you a message on WingleMingle: '${message}'. Sign up to see who it is!"`);

    return { ok: true, data: newSecretWingle }
  } catch (err) {
    console.error('Send Secret Wingle error:', err)
    return { ok: false, error: 'Failed to send Secret Wingle' }
  }
}

export async function getReceivedSecretWinglesAction() {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const currentUser = await db.orm.public.User.where({ id: session.userId as string }).first()
    if (!currentUser || !currentUser.phone) {
      return { ok: true, data: [] }
    }

    const secretWingles = await db.orm.public.SecretWingle.where({
      targetPhone: currentUser.phone
    }).all()

    // Unlock all of them since the user is now signed in
    if (secretWingles.length > 0) {
      for (const sw of secretWingles) {
        if (!sw.unlocked) {
          await db.orm.public.SecretWingle.where({ id: sw.id }).update({ unlocked: true })
        }
      }
    }

    const sendersIds = Array.from(new Set(secretWingles.map(sw => sw.senderId)));
    const senders = await Promise.all(sendersIds.map(id => db.orm.public.User.where({ id }).first()));
    const validSenders = senders.filter(Boolean);

    const populatedSecretWingles = secretWingles.map(sw => {
      const sender = validSenders.find(s => s && s.id === sw.senderId);
      return {
        ...sw,
        unlocked: true,
        sender: sender ? {
          id: sender.id,
          name: sender.name,
          age: sender.age,
          gender: sender.gender,
          location: sender.location
        } : null
      }
    });

    return { ok: true, data: populatedSecretWingles }
  } catch (err) {
    console.error('Get Secret Wingles error:', err)
    return { ok: false, error: 'Failed to fetch Secret Wingles' }
  }
}
