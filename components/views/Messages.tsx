'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircleIcon, SparklesIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Avatar, EmptyState } from '@/components/ui/Bits';
import { UsageMeter } from '@/components/UsageMeter';
import { useStore } from '@/lib/contexts/StoreContext';
import { relativeTime } from '@/lib/utils/format';

export function Messages() {
  const router = useRouter();
  const { conversationsOf, messagesOf, currentUser, userById, photosOf, entitlements, openChatPopup } = useStore();
  if (!currentUser || !entitlements) return null;

  const conversations = conversationsOf();

  return (
    <Page>
      <PageHeader
        title="Messages"
        body="Conversations open as soon as a dating request is accepted."
        action={
        entitlements.chatRemaining !== null && entitlements.chatRemaining <= 5 ?
        <Button onClick={() => router.push('/packages')}>
              <SparklesIcon className="h-4 w-4" />
              Top up messages
            </Button> :
        undefined
        } />
      

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="max-w-2xl">
          {conversations.length === 0 ?
          <EmptyState
            icon={<MessageCircleIcon className="h-5 w-5" />}
            title="No conversations yet"
            body="Send a dating request, and the moment it is accepted a conversation opens right here."
            action={<Button onClick={() => router.push('/discover')}>Discover people</Button>} /> :


          <ul className="divide-y divide-sand overflow-hidden rounded-4xl bg-white shadow-card">
              {conversations.map((conversation) => {
              const otherId = conversation.userIds.find((uid) => uid !== currentUser.id) as string;
              const user = userById(otherId);
              const photo = user ? photosOf(otherId)[0] : undefined;
              const messages = messagesOf(conversation.id);
              const last = messages[messages.length - 1];
              const unread = messages.filter((m) => m.senderId !== currentUser.id && !m.readAt).length;
              if (!user) return null;
              return (
                <li key={conversation.id}>
                    <button
                    onClick={() => {
                      if (window.innerWidth >= 1024) {
                        openChatPopup(conversation.id);
                      } else {
                        router.push(`/messages/${conversation.id}`);
                      }
                    }}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors duration-150 ease-soft hover:bg-cream">
                    
                      <Avatar src={photo?.url} name={user.name} size={52} online={user.online} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate font-medium text-ink">{user.name}</span>
                          <span className="shrink-0 text-[12px] text-ink-muted">
                            {last ? relativeTime(last.createdAt) : ''}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-3">
                          <span
                          className={`truncate text-[13px] ${
                          unread ? 'font-medium text-ink' : 'text-ink-soft'}`
                          }>
                          
                            {last ?
                          last.deleted ?
                          'Message deleted' :
                          last.imageUrl && !last.body ?
                          'Sent a photo' :
                          last.body :
                          'Say hello'}
                          </span>
                          {!!unread &&
                        <span className="shrink-0 rounded-full bg-berry-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                              {unread}
                            </span>
                        }
                        </span>
                      </span>
                    </button>
                  </li>);

            })}
            </ul>
          }
        </div>

        <aside className="space-y-5">
          <div className="rounded-4xl bg-white p-5 shadow-card">
            <h2 className="mb-4 font-display text-lg text-ink">Chat allowance</h2>
            <UsageMeter
              label="Messages remaining"
              used={entitlements.chatUsed}
              limit={entitlements.chatLimit} />
            
            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
              {entitlements.chatLimit === null ?
              'Your package includes unlimited messages.' :
              `You have used ${entitlements.chatUsed} of ${entitlements.chatLimit} messages on the ${entitlements.packageName} package.`}
            </p>
            {entitlements.chatRemaining !== null &&
            <Button
              size="sm"
              block
              className="mt-4"
              variant={entitlements.chatRemaining === 0 ? 'primary' : 'outline'}
              onClick={() => router.push('/packages')}>
              
                {entitlements.chatRemaining === 0 ? 'Upgrade to keep chatting' : 'See packages'}
              </Button>
            }
          </div>
        </aside>
      </div>
    </Page>);

}