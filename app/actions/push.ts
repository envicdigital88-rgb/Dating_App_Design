'use server';

import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import webpush from 'web-push';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@winglemingle.com';

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error('Failed to set VAPID details:', err);
  }
}

export async function savePushSubscriptionAction(subscription: any) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const userId = session.userId as string;

    if (!subscription || !subscription.endpoint) {
      return { ok: false, error: 'Invalid subscription' };
    }

    const subObj = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;

    await db.orm.public.User.where({ id: userId }).update({
      pushSubscription: subObj,
    });

    return { ok: true };
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return { ok: false, error: 'Internal Server Error' };
  }
}

export async function sendPushNotificationAction(userId: string, payload: { title: string; body: string; icon?: string; url?: string }) {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('VAPID keys not configured, cannot send push notification');
      return { ok: false, error: 'VAPID keys missing' };
    }

    const user = await db.orm.public.User.where({ id: userId }).first();
    if (!user || !user.pushSubscription) return { ok: false, error: 'User or subscription not found' };

    let subscription: any = user.pushSubscription;
    if (typeof subscription === 'string') {
      try {
        subscription = JSON.parse(subscription);
      } catch (e) {
        console.error('Error parsing push subscription string:', e);
      }
    }
    if (typeof subscription === 'string') {
      try {
        subscription = JSON.parse(subscription);
      } catch (e) {}
    }

    if (!subscription || typeof subscription !== 'object' || !subscription.endpoint) {
      console.warn('Invalid push subscription structure for user:', userId);
      return { ok: false, error: 'Invalid push subscription' };
    }

    const pushPayload = JSON.stringify({
      title: payload.title || 'Wingle Mingle',
      body: payload.body || '',
      icon: payload.icon || '/web-app-manifest-192x192.png',
      badge: '/favicon-96x96.png',
      url: payload.url || '/discover'
    });

    await webpush.sendNotification(subscription, pushPayload);
    return { ok: true };
  } catch (error: any) {
    console.error('Error sending push notification to user', userId, error);
    // If subscription is expired or unsubscribed (410 Gone or 404 Not Found), clear it
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      try {
        await db.orm.public.User.where({ id: userId }).update({
          pushSubscription: null
        });
      } catch (e) {}
    }
    return { ok: false, error: error?.message || 'Failed to send push notification' };
  }
}
