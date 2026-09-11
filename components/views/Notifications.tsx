'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  BellIcon,
  CreditCardIcon,
  HeartIcon,
  LockIcon,
  MessageCircleIcon,
  SendIcon,
  SparklesIcon,
  UsersIcon } from
'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Bits';
import { usePwa } from '@/components/PwaProvider';
import { useStore } from '@/lib/contexts/StoreContext';
import { relativeTime } from '@/lib/utils/format';
import type { NotificationType } from '@/lib/types';

const icons: Record<NotificationType, React.ReactNode> = {
  wingle_received: <SendIcon className="h-4 w-4" />,
  wingle_accepted: <SendIcon className="h-4 w-4" />,
  mingle: <MessageCircleIcon className="h-4 w-4" />,
  connection: <UsersIcon className="h-4 w-4" />,
  like: <HeartIcon className="h-4 w-4" />,
  package_activated: <SparklesIcon className="h-4 w-4" />,
  chat_limit_warning: <LockIcon className="h-4 w-4" />,
  chat_limit_reached: <LockIcon className="h-4 w-4" />,
  payment_success: <CreditCardIcon className="h-4 w-4" />,
  subscription_expiring: <CreditCardIcon className="h-4 w-4" />
};

export function Notifications() {
  const router = useRouter();
  const { notificationsOf, markNotificationRead, markAllNotificationsRead } = useStore();
  const { notificationsEnabled, enableNotifications } = usePwa();
  const notifications = notificationsOf();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Page>
      <PageHeader
        title="Notifications"
        body={unread ? `${unread} unread` : 'You are all caught up.'}
        action={
        notifications.length > 0 ?
        <Button variant="outline" onClick={markAllNotificationsRead} disabled={!unread}>
              Mark all read
            </Button> :
        undefined
        } />
      

      <div className="min-w-0 max-w-2xl space-y-5 overflow-hidden">
        {!notificationsEnabled &&
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-4xl border border-sand bg-cream-deep p-5">
            <div>
              <p className="font-display text-lg text-ink">Turn on push notifications</p>
              <p className="mt-1 text-[13px] text-ink-soft">
                Get told about new wingles and mingles without opening the app.
              </p>
            </div>
            <Button onClick={enableNotifications}>Enable</Button>
          </div>
        }

        {notifications.length === 0 ?
        <EmptyState
          icon={<BellIcon className="h-5 w-5" />}
          title="Nothing here yet"
          body="Wingles, accepted connections, new mingles and package updates all land here." /> :


        <ul className="flex flex-col gap-4">
            {notifications.map((notification) =>
          <li key={notification.id} className="overflow-hidden rounded-4xl bg-white/15 backdrop-blur-md ring-1 ring-white/10 shadow-sm">
                <button
              onClick={() => {
                markNotificationRead(notification.id);
                if (notification.href) router.push(notification.href);
              }}
              className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors duration-150 ease-soft hover:bg-white/15">
              
                  <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                notification.read ? 'bg-cream-deep text-ink-muted' : 'bg-berry-100 text-berry-600'}`
                }>
                
                    {icons[notification.type]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                    className={`truncate text-[15px] ${
                    notification.read ? 'text-ink-soft' : 'font-medium text-ink'}`
                    }>
                    
                        {notification.title}
                      </span>
                      {!notification.read &&
                  <span className="h-2 w-2 shrink-0 rounded-full bg-berry-500" />
                  }
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-soft">
                      {notification.body}
                    </span>
                    <span className="mt-1 block text-[12px] text-ink-muted">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
          )}
          </ul>
        }
      </div>
    </Page>);

}
