'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UsersIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { EmptyState, VerifiedMark } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { presence, shortDate } from '@/lib/utils/format';

export function Connections() {
  const router = useRouter();
  const { db, currentUser, userById, photosOf, ensureConversation, openChatPopup } = useStore();
  if (!currentUser) return null;

  const connections = db.connections.
  filter((c) => c.userIds.includes(currentUser.id)).
  sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Page>
      <PageHeader
        title="Connections"
        body="People who accepted your request, or whose request you accepted." />
      

      {connections.length === 0 ?
      <EmptyState
        icon={<UsersIcon className="h-5 w-5" />}
        title="No connections yet"
        body="A connection is made the moment a dating request is accepted. Your sent requests are still pending — give it a day."
        action={<Button onClick={() => router.push('/requests')}>See my requests</Button>} /> :


      <ul className="grid max-w-4xl gap-4 sm:grid-cols-2">
          {connections.map((connection) => {
          const otherId = connection.userIds.find((uid) => uid !== currentUser.id) as string;
          const user = userById(otherId);
          const photo = user ? photosOf(user.id)[0] : undefined;
          if (!user) return null;
          return (
            <li key={connection.id} className="flex gap-4 rounded-4xl bg-cream-deep p-4 shadow-card">
                {photo &&
              <img src={photo.url} alt="" className="h-24 w-20 shrink-0 rounded-2xl object-cover" />
              }
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-display text-[19px] leading-tight text-ink">
                      {user.name}, {user.age}
                    </p>
                    {user.verified && <VerifiedMark />}
                  </div>
                  <p className="mt-1 text-[13px] text-ink-soft">
                    {user.location} · {presence(user.online, user.lastActiveAt)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">
                    Connected {shortDate(connection.createdAt)}
                  </p>
                  <div className="mt-auto flex gap-2 pt-3">
                    <Button
                    size="sm"
                    onClick={() => {
                      const conversation = ensureConversation(user.id);
                      if (window.innerWidth >= 1024) {
                        openChatPopup(conversation.id);
                      } else {
                        router.push(`/messages/${conversation.id}`);
                      }
                    }}>
                    
                      Message
                    </Button>
                    <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/profile/${user.id}`)}>
                    
                      Profile
                    </Button>
                  </div>
                </div>
              </li>);

        })}
        </ul>
      }
    </Page>);

}
