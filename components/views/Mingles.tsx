'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircleIcon, SparklesIcon, SearchIcon, MicIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Avatar, EmptyState } from '@/components/ui/Bits';
import { UsageMeter } from '@/components/UsageMeter';
import { useStore } from '@/lib/contexts/StoreContext';
import { listTime } from '@/lib/utils/format';
import { AddStatusModal } from '@/components/ui/AddStatusModal';
import { StatusViewer } from '@/components/ui/StatusViewer';

export function Mingles() {
  const router = useRouter();
  const { conversationsOf, minglesOf, currentUser, userById, photosOf, entitlements, openChatPopup, statusesOf, myStatuses } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [viewingStatusUserId, setViewingStatusUserId] = useState<string | null>(null);

  if (!currentUser || !entitlements) return null;

  const conversations = conversationsOf();

  // Map to include user data so we can easily filter and find online users
  const conversationData = conversations
    .map((conversation) => {
      const otherId = conversation.userIds.find((uid) => uid !== currentUser.id) as string;
      const user = userById(otherId);
      const photo = user ? photosOf(otherId)[0] : undefined;
      return { conversation, user, photo, otherId };
    })
    .filter((data) => data.user !== undefined) as { conversation: any, user: any, photo: any, otherId: string }[];

  const usersWithStatus = conversationData.filter((data) => statusesOf(data.otherId).length > 0);
  const hasMyStatus = myStatuses().length > 0;

  const filteredConversations = conversationData.filter((data) =>
    data.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Page>
      <PageHeader
        title="Mingles"
        body="Conversations open as soon as a wingling wingle is accepted."
        action={
          entitlements.chatRemaining !== null && entitlements.chatRemaining <= 5 ? (
            <Button onClick={() => router.push('/packages')}>
              <SparklesIcon className="h-4 w-4" />
              Top up mingles
            </Button>
          ) : undefined
        }
      />

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 w-full overflow-hidden lg:max-w-2xl">
          {conversations.length === 0 ? (
            <EmptyState
              icon={<MessageCircleIcon className="h-5 w-5" />}
              title="No conversations yet"
              body="Send a wingling wingle, and the moment it is accepted a conversation opens right here."
              action={<Button onClick={() => router.push('/discover')}>Discover people</Button>}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Search Bar */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-muted">
                  <SearchIcon className="h-[18px] w-[18px]" />
                </div>
                <input
                  type="text"
                  placeholder="Find Your Friends"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-white/10 bg-white/5 py-3.5 pl-11 pr-12 text-[15px] text-ink placeholder-ink-muted shadow-sm backdrop-blur-md outline-none transition-colors focus:border-white/20 focus:bg-white/10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-ink-muted hover:text-ink"
                  aria-label="Voice search"
                >
                  <MicIcon className="h-[18px] w-[18px]" />
                </button>
              </div>

              {/* Status Updates Horizontal Scroll */}
              <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex gap-4">
                  
                  {/* Current User Add Status or View Own */}
                  <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                    <div className="relative rounded-full p-[3px]">
                      {hasMyStatus && (
                        <div className="absolute inset-0 pointer-events-none rounded-full border-[3px] border-transparent bg-gradient-to-tr from-[#0ea5e9] to-[#ec4899]" style={{ WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
                      )}
                      
                      {/* Avatar Button (Views Status if exists, otherwise adds) */}
                      <button onClick={() => hasMyStatus ? setViewingStatusUserId(currentUser.id) : setShowAddStatus(true)}>
                        <Avatar src={photosOf(currentUser.id)[0]?.url} name={currentUser.name} size={60} />
                      </button>

                      {/* Always present '+' button to add more statuses */}
                      <button 
                        onClick={() => setShowAddStatus(true)}
                        className="absolute bottom-0 right-0 z-10 rounded-full bg-white p-0.5 text-black shadow-md border-2 border-black hover:scale-110 transition-transform"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                      </button>
                    </div>
                    <span className="w-full truncate text-center text-[11px] font-medium text-ink">
                      Your Status
                    </span>
                  </div>

                  {/* Friends Statuses */}
                  {usersWithStatus.map((data) => (
                    <button
                      key={data.otherId}
                      onClick={() => setViewingStatusUserId(data.otherId)}
                      className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                    >
                      <div className="relative rounded-full p-[3px]">
                        {/* Status border indicator */}
                        <div className="absolute inset-0 rounded-full border-[3px] border-transparent bg-gradient-to-tr from-[#0ea5e9] to-[#ec4899]" style={{ WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
                        <Avatar src={data.photo?.url} name={data.user.name} size={60} online={data.user.online} />
                      </div>
                      <span className="w-full truncate text-center text-[11px] font-medium text-ink">
                        {data.user.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat List */}
              <ul className="flex min-w-0 flex-col gap-4">
                {filteredConversations.map(({ conversation, user, photo }) => {
                  const mingles = minglesOf(conversation.id);
                  const last = mingles[mingles.length - 1];
                  const unread = mingles.filter((m) => m.senderId !== currentUser.id && !m.readAt).length;
                  return (
                    <li
                      key={conversation.id}
                      className="overflow-hidden rounded-4xl bg-white/15 shadow-sm ring-1 ring-white/10 backdrop-blur-md"
                    >
                      <button
                        onClick={() => {
                          if (window.innerWidth >= 1024) {
                            openChatPopup(conversation.id);
                          } else {
                            router.push(`/mingles/${conversation.id}`);
                          }
                        }}
                        className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors duration-150 ease-soft hover:bg-white/15"
                      >
                        <Avatar src={photo?.url} name={user.name} size={52} online={user.online} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="min-w-0 flex-1 truncate font-medium text-ink">{user.name}</span>
                            <span className="shrink-0 text-[12px] text-ink-muted">
                              {last ? listTime(last.createdAt) : ''}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-3">
                            <span
                              className={`min-w-0 flex-1 truncate text-[13px] ${
                                unread ? 'font-medium text-ink' : 'text-ink-soft'
                              }`}
                            >
                              {last
                                ? last.deleted
                                  ? 'Mingle deleted'
                                  : last.imageUrl && !last.body
                                  ? 'Sent a photo'
                                  : last.body
                                : 'Say hello'}
                            </span>
                            {!!unread && (
                              <span className="shrink-0 rounded-full bg-berry-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
                {filteredConversations.length === 0 && searchQuery !== '' && (
                  <div className="py-8 text-center text-sm text-ink-muted">
                    No friends found matching "{searchQuery}".
                  </div>
                )}
              </ul>
            </div>
          )}
        </div>

        <aside className="hidden space-y-5 lg:block">
          <div className="rounded-4xl bg-cream-deep p-5 shadow-card">
            <h2 className="mb-4 font-display text-lg text-ink">Chat allowance</h2>
            <UsageMeter
              label="Mingles remaining"
              used={entitlements.chatUsed}
              limit={entitlements.chatLimit}
            />
            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
              {entitlements.chatLimit === null
                ? 'Your package includes unlimited mingles.'
                : `You have used ${entitlements.chatUsed} of ${entitlements.chatLimit} mingles on the ${entitlements.packageName} package.`}
            </p>
            {entitlements.chatRemaining !== null && (
              <Button
                size="sm"
                block
                className="mt-4"
                variant={entitlements.chatRemaining === 0 ? 'primary' : 'outline'}
                onClick={() => router.push('/packages')}
              >
                {entitlements.chatRemaining === 0 ? 'Upgrade to keep chatting' : 'See packages'}
              </Button>
            )}
          </div>
        </aside>
      </div>

      {showAddStatus && <AddStatusModal onClose={() => setShowAddStatus(false)} />}
      {viewingStatusUserId && <StatusViewer userId={viewingStatusUserId} onClose={() => setViewingStatusUserId(null)} />}
    </Page>
  );
}
