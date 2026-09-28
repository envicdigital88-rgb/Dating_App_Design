'use server';

import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import webpush from 'web-push';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@winglemingle.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function savePushSubscriptionAction(subscription: any) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const userId = session.userId as string;

    await db.orm.public.User.where({ id: userId }).update({
      pushSubscription: JSON.stringify(subscription),
    });

    return { ok: true };
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return { ok: false, error: 'Internal Server Error' };
  }
}

export async function sendPushNotificationAction(userId: string, payload: { title: string; body: string; icon?: string; url?: string }) {
  try {
    const user = await db.orm.public.User.where({ id: userId }).first();
    if (!user || !user.pushSubscription) return { ok: false, error: 'User or subscription not found' };

    const subscription = JSON.parse(user.pushSubscription as string);

    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { ok: false, error: 'Failed to send push notification' };
  }
}
