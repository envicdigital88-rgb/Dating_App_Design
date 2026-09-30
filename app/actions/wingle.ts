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

    const newWingle = await db.transaction(async (tx) => {
      const user = await tx.orm.public.User.where({ id: session.userId as string }).first();
      if (!user) throw new Error('User not found');
      
      let wingitsCost = 8;
      if (user.isUnlimited) {
        wingitsCost = 0;
      } else if (user.freeWinglesSent < 5) {
        wingitsCost = 0;
      }

      if (user.wingitsBalance < wingitsCost) {
        throw new Error('Not enough Wingits to send Wingle.');
      }

      const updates: any = {};
      if (wingitsCost > 0) updates.wingitsBalance = user.wingitsBalance - wingitsCost;
      if (wingitsCost === 0) updates.freeWinglesSent = user.freeWinglesSent + 1;
      
      await tx.orm.public.User.where({ id: user.id }).update(updates);
      
      if (wingitsCost > 0) {
        await tx.orm.public.WingitsTransaction.create({
          userId: user.id,
          amount: -wingitsCost,
          type: 'spend',
          description: 'Sent a Wingle'
        });
      }

      return await tx.orm.public.Wingle.create({
        fromUserId: user.id,
        toUserId: toUserId,
        note: note
      });
    });

    await db.orm.public.Notification.create({
      userId: toUserId,
      type: 'wingle_received',
      title: 'New Wingle!',
      body: 'Someone sent you a Wingle. Check it out!',
      href: '/wingles'
    })

    try {
      const { sendPushNotificationAction } = await import('@/app/actions/push');
      await sendPushNotificationAction(toUserId, {
        title: 'New Wingle!',
        body: 'Someone sent you a Wingle. Check it out!',
        url: 'https://winglemingle.com/wingles'
      });
      const { pusherServer } = await import('@/lib/pusher');
      await pusherServer.trigger(`private-user-${toUserId}`, 'state-changed', {});
    } catch (e) {
      console.error('Push error:', e);
    }

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

    const { connection, conversation } = await db.transaction(async (tx) => {
      let acceptCost = 4;
      if (accept) {
        const receiver = await tx.orm.public.User.where({ id: session.userId as string }).first();
        if (!receiver) throw new Error('Receiver not found');
        if (receiver.isUnlimited) {
          acceptCost = 0;
        } else if (receiver.freeWinglesAccepted < 2) {
          acceptCost = 0;
        }

        if (receiver.wingitsBalance < acceptCost) {
          throw new Error('Not enough Wingits to accept.');
        }

        const updates: any = {};
        if (acceptCost > 0) updates.wingitsBalance = receiver.wingitsBalance - acceptCost;
        if (acceptCost === 0) updates.freeWinglesAccepted = receiver.freeWinglesAccepted + 1;
        
        await tx.orm.public.User.where({ id: receiver.id }).update(updates);
        if (acceptCost > 0) {
          await tx.orm.public.WingitsTransaction.create({
            userId: receiver.id,
            amount: -acceptCost,
            type: 'spend',
            description: 'Accepted a Wingle'
          });
        }
      } else {
        // Refund 3 Wingits to the sender
        const sender = await tx.orm.public.User.where({ id: wingle.fromUserId }).first();
        if (sender) {
          await tx.orm.public.User.where({ id: sender.id }).update({
            wingitsBalance: sender.wingitsBalance + 3
          });
          await tx.orm.public.WingitsTransaction.create({
            userId: sender.id,
            amount: 3,
            type: 'refund',
            description: 'Wingle was declined'
          });
        }
      }

      // Update Wingle
      await tx.orm.public.Wingle.where({ id: wingleId }).update({
        status: newStatus,
        respondedAt: Temporal.Now.instant()
      });

      let conn = null;
      let conv = null;

      // If accepted, create a Connection and Conversation
      if (accept) {
        const u1 = wingle.fromUserId < wingle.toUserId ? wingle.fromUserId : wingle.toUserId
        const u2 = wingle.fromUserId < wingle.toUserId ? wingle.toUserId : wingle.fromUserId

        conn = await tx.orm.public.Connection.where({ userId1: u1, userId2: u2 }).first()
        if (!conn) {
          conn = await tx.orm.public.Connection.create({
            userId1: u1,
            userId2: u2
          })
        }

        conv = await tx.orm.public.Conversation.where({ userId1: u1, userId2: u2 }).first()
        if (!conv) {
          conv = await tx.orm.public.Conversation.create({
            userId1: u1,
            userId2: u2
          })
        }
      }
      return { connection: conn, conversation: conv };
    });

    console.log(`[respondToWingle] Wingle status updated to ${newStatus}`);
    if (accept && connection && conversation) {
      console.log(`[respondToWingle] Created Connection ${connection.id} and Conversation ${conversation.id}`);

      await db.orm.public.Notification.create({
        userId: wingle.fromUserId,
        type: 'wingle_accepted',
        title: 'Wingle Accepted!',
        body: 'Your Wingle was accepted. You can now chat!',
        href: `/mingles/${conversation.id}`
      });

      try {
        const { sendPushNotificationAction } = await import('@/app/actions/push');
        await sendPushNotificationAction(wingle.fromUserId, {
          title: 'Wingle Accepted!',
          body: 'Your Wingle was accepted. You can now chat!',
          url: `https://winglemingle.com/mingles/${conversation.id}`
        });
      } catch (e) {
        console.error('Push error:', e);
      }

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
    const senders = sendersIds.length > 0 
      ? await db.orm.public.User.where(u => u.id.in(sendersIds)).all()
      : [];
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
