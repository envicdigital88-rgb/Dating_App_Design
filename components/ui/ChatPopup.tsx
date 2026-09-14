'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SendIcon, MinusIcon, Maximize2Icon, ChevronUpIcon, CheckIcon, CheckCheckIcon } from 'lucide-react';
import { Avatar } from './Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { dayLabel, mingleTime, presence } from '@/lib/utils/format';
import { toast } from 'sonner';

export function ChatPopup() {
  const router = useRouter();
  const {
    db,
    currentUser,
    activePopupChatId,
    closeChatPopup,
    minglesOf,
    sendMingle,
    markConversationRead,
    userById,
    photosOf,
    typingIn,
    entitlements
  } = useStore();

  const [draft, setDraft] = useState('');
  const [minimized, setMinimized] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const conversation = db.conversations.find((c) => c.id === activePopupChatId);
  const mingles = useMemo(
    () => conversation ? minglesOf(conversation.id) : [],
    [conversation, minglesOf]
  );

  useEffect(() => {
    if (conversation) markConversationRead(conversation.id);
  }, [conversation, mingles.length, markConversationRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mingles.length, typingIn, activePopupChatId]);

  if (!activePopupChatId || !conversation || !currentUser || !entitlements) return null;

  const otherId = conversation.userIds.find((uid) => uid !== currentUser.id) as string;
  const other = userById(otherId);
  const photo = photosOf(otherId)[0];

  const submit = () => {
    if (!draft.trim()) return;
    const hasNumbersRegex = /\d/;
    if (hasNumbersRegex.test(draft)) {
      toast.error('Sharing numbers is not allowed for privacy reasons.');
      return;
    }

    const result = sendMingle(conversation.id, draft);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDraft('');
  };

  let lastDay = '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1, height: minimized ? 70 : 480 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 right-4 lg:right-10 z-[100] flex w-[340px] flex-col overflow-hidden rounded-t-2xl border border-sand/60 bg-cream shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
      >
        <header className="flex items-center gap-3 border-b border-sand/70 bg-cream-deep px-3 py-3 shadow-sm cursor-pointer" onClick={() => setMinimized(!minimized)}>
          <Avatar src={photo?.url} name={other?.name ?? '?'} size={36} online={other?.online} />
          <div className="flex-1 min-w-0">
            <span className="block truncate font-medium text-ink leading-tight">{other?.name}</span>
            <span className="block truncate text-[11px] text-ink-muted">
              {typingIn === conversation.id ? 'Typing...' : other ? presence(other.online, other.lastActiveAt) : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/mingles/${conversation.id}`); closeChatPopup(); }}
              className="rounded-full p-1.5 text-ink-muted hover:bg-cream hover:text-ink transition-colors"
            >
              <Maximize2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
              className="rounded-full p-1.5 text-ink-muted hover:bg-cream hover:text-ink transition-colors"
            >
              {minimized ? <ChevronUpIcon className="h-5 w-5" /> : <MinusIcon className="h-5 w-5" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); closeChatPopup(); }}
              className="rounded-full p-1.5 text-ink-muted hover:bg-cream hover:text-ink transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {!minimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {mingles.map((mingle) => {
            if (mingle.deleted) return null;
            const isMe = mingle.senderId === currentUser.id;
            const day = dayLabel(mingle.createdAt);
            const showDay = day !== lastDay;
            if (showDay) lastDay = day;

            return (
              <React.Fragment key={mingle.id}>
                {showDay && (
                  <div className="my-2 text-center text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                    {day}
                  </div>
                )}
                <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${isMe ? 'bg-berry-500 text-white rounded-tr-sm' : 'bg-cream-deep text-ink border border-sand/40 rounded-tl-sm shadow-sm'}`}>
                    {mingle.imageUrl && (
                      <img src={mingle.imageUrl} alt="" className="mb-2 max-h-48 w-full rounded-xl object-cover" />
                    )}
                    {mingle.body && <p className="whitespace-pre-wrap break-words">{mingle.body}</p>}
                    <span className={`mt-1 flex items-center gap-1 text-[10px] ${isMe ? 'justify-end text-white/70' : 'justify-start text-ink-muted'}`}>
                      {mingleTime(mingle.createdAt)}
                      {isMe && (
                        mingle.readAt ? (
                          <CheckCheckIcon className="h-3 w-3 text-plum-500" />
                        ) : other?.online ? (
                          <CheckCheckIcon className="h-3 w-3 text-plum-500/70" />
                        ) : (
                          <CheckIcon className="h-2.5 w-2.5 text-plum-500/70" />
                        )
                      )}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          {typingIn === conversation.id && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-sand/40 bg-cream-deep px-3 py-2.5 shadow-sm">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-sand/60 bg-cream-deep p-3">
          <div className="flex items-center gap-2 rounded-full border border-sand/60 bg-cream/50 px-3 py-1.5 focus-within:border-berry-500 focus-within:bg-cream-deep transition-colors">
            <input
              type="text"
              placeholder="Type a mingle..."
              className="flex-1 bg-transparent px-2 py-1.5 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button
              onClick={submit}
              disabled={!draft.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-berry-500 text-white disabled:opacity-50 transition-opacity"
            >
              <SendIcon className="h-4 w-4 text-plum-500" />
            </button>
          </div>
        </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
