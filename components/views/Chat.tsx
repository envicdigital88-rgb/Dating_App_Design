'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, redirect } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  BanIcon,
  CheckIcon,
  CheckCheckIcon,
  FlagIcon,
  ImageIcon,
  LockIcon,
  MoreVerticalIcon,
  SendIcon,
  SmileIcon,
  Trash2Icon } from
'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, Badge } from '@/components/ui/Bits';
import { Modal } from '@/components/ui/Modal';
import { ReportDialog } from '@/components/ReportDialog';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { useStore } from '@/lib/contexts/StoreContext';
import { dayLabel, messageTime, presence } from '@/lib/utils/format';
import { processPhoto, screenPhoto } from '@/lib/utils/image';

import EmojiPicker from 'emoji-picker-react';


export function Chat() {
  const { conversationId } = useParams();
  const router = useRouter();
    const navigate = router.push;
  const {
    db,
    currentUser,
    entitlements,
    messagesOf,
    sendMessage,
    markConversationRead,
    deleteMessage,
    userById,
    photosOf,
    blockUser,
    typingIn
  } = useStore();

  const [draft, setDraft] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const conversation = db.conversations.find((c) => c.id === conversationId);
  const messages = useMemo(
    () => conversation ? messagesOf(conversation.id) : [],
    [conversation, messagesOf]
  );

  useEffect(() => {
    if (conversation) markConversationRead(conversation.id);
  }, [conversation, messages.length, markConversationRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, typingIn]);

  if (!conversation || !currentUser || !entitlements) { redirect("/messages"); return null as any; }

  const otherId = conversation.userIds.find((uid) => uid !== currentUser.id) as string;
  const other = userById(otherId);
  const photo = photosOf(otherId)[0];
  const limitReached = entitlements.chatRemaining !== null && entitlements.chatRemaining <= 0;

  const submit = (imageUrl?: string) => {
    if (!imageUrl && !draft.trim()) return;

    // Prevent sending ANY numbers for strict privacy
    const hasNumbersRegex = /\d/;
    if (hasNumbersRegex.test(draft)) {
      toast.error('Sharing numbers is not allowed for privacy reasons.');
      return;
    }

    const result = sendMessage(conversation.id, draft, imageUrl);
    if (!result.ok) {
      if (result.reason === 'chat_limit') setUpgradeOpen(true);else
      toast.error(result.error);
      return;
    }
    setDraft('');
    setShowEmoji(false);
  };

  const attach = async (files: FileList | null) => {
    if (!files?.[0]) return;
    const screen = screenPhoto(files[0]);
    if (!screen.ok) {
      toast.error(screen.error as string);
      return;
    }
    if (limitReached) {
      setUpgradeOpen(true);
      return;
    }
    const url = await processPhoto(files[0], { maxWidth: 720, quality: 0.75 });
    submit(url);
    if (fileRef.current) fileRef.current.value = '';
  };

  let lastDay = '';

  return (
    <div className="flex h-[100dvh] flex-col bg-cream">
      <header className="flex items-center gap-3 border-b border-sand/70 bg-white px-3 py-2.5 sm:px-5">
        <button
          onClick={() => navigate('/messages')}
          aria-label="Back to messages"
          className="rounded-full p-2 text-ink-soft transition-colors duration-150 ease-soft hover:bg-cream">
          
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => navigate(`/profile/${otherId}`)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left">
          
          <Avatar src={photo?.url} name={other?.name ?? '?'} size={40} online={other?.online} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{other?.name}</span>
            <span className="block truncate text-[12px] text-ink-muted">
              {typingIn === conversation.id ?
              'Typing' :
              other ?
              presence(other.online, other.lastActiveAt) :
              ''}
            </span>
          </span>
        </button>
        <span className="hidden sm:block">
          <Badge tone={limitReached ? 'red' : 'neutral'}>
            {entitlements.chatRemaining === null ?
            'Unlimited' :
            `${entitlements.chatRemaining} left`}
          </Badge>
        </span>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Conversation options"
          className="rounded-full p-2 text-ink-soft transition-colors duration-150 ease-soft hover:bg-cream">
          
          <MoreVerticalIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-2">
          {messages.map((message) => {
            const mine = message.senderId === currentUser.id;
            const day = dayLabel(message.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <React.Fragment key={message.id}>
                {showDay &&
                <p className="py-3 text-center text-[12px] font-medium text-ink-muted">{day}</p>
                }
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className={`group flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                  
                  {mine && !message.deleted &&
                  <button
                    onClick={() => setPendingDelete(message.id)}
                    aria-label="Delete message"
                    className="mb-1 rounded-full p-1.5 text-ink-muted opacity-0 transition-opacity duration-150 ease-soft hover:bg-white group-hover:opacity-100">
                    
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </button>
                  }
                  <div
                    className={`max-w-[78%] rounded-3xl px-4 py-2.5 ${
                    message.deleted ?
                    'border border-dashed border-sand bg-transparent text-ink-muted' :
                    mine ?
                    'bg-berry-500 text-white' :
                    'bg-white text-ink shadow-sm'}`
                    }>
                    
                    {message.deleted ?
                    <p className="text-[13px] italic">Message deleted</p> :

                    <>
                        {message.imageUrl &&
                      <img
                        src={message.imageUrl}
                        alt="Shared photo"
                        className="mb-2 max-h-72 w-full rounded-2xl object-cover" />

                      }
                        {message.body &&
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                            {message.body}
                          </p>
                      }
                        <p
                        className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
                        mine ? 'text-white/70' : 'text-ink-muted'}`
                        }>
                        
                          {messageTime(message.createdAt)}
                          {mine && (
                            message.readAt ? (
                              <CheckCheckIcon className="h-3.5 w-3.5 text-blue-300" />
                            ) : other?.online ? (
                              <CheckCheckIcon className="h-3.5 w-3.5 opacity-50" />
                            ) : (
                              <CheckIcon className="h-3 w-3 opacity-50" />
                            )
                          )}
                        </p>
                      </>
                    }
                  </div>
                </motion.div>
              </React.Fragment>);

          })}

          <AnimatePresence>
            {typingIn === conversation.id &&
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
              className="flex gap-1.5 rounded-3xl bg-white px-4 py-3 shadow-sm"
              style={{ width: 'fit-content' }}
              aria-label={`${other?.name} is typing`}>
              
                {[0, 1, 2].map((i) =>
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted"
                style={{ animationDelay: `${i * 120}ms` }} />

              )}
              </motion.div>
            }
          </AnimatePresence>
          <div ref={endRef} />
        </div>
      </div>

      {limitReached ?
      <div className="border-t border-sand/70 bg-white px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-4 rounded-4xl bg-plum-500 p-5 text-cream">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream/15">
              <LockIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg leading-tight">Your chat limit has been reached</p>
              <p className="mt-1 text-[13px] text-cream/75">
                You have used all {entitlements.chatLimit} messages on the {entitlements.packageName}{' '}
                package. Upgrade to keep this conversation going.
              </p>
            </div>
            <Button
            variant="inverse"
            onClick={() => navigate('/packages')}>
            
              Upgrade package
            </Button>
          </div>
        </div> :

      <div className="border-t border-sand/70 bg-white px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5">
          <div className="mx-auto max-w-2xl relative">
            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-2 z-50 shadow-xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
                <EmojiPicker 
                  onEmojiClick={(emojiData) => {
                    setDraft((d) => d + emojiData.emoji);
                  }}
                />
              </div>
            )}
            <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-end gap-2">
            
              <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => attach(e.target.files)} />
            
              <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Send a photo"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sand text-ink-soft transition-colors duration-150 ease-soft hover:border-berry-300 hover:text-berry-600">
              
                <ImageIcon className="h-5 w-5" />
              </button>
              <button
              type="button"
              onClick={() => setShowEmoji((s) => !s)}
              aria-label="Emoji"
              aria-expanded={showEmoji}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sand text-ink-soft transition-colors duration-150 ease-soft hover:border-berry-300 hover:text-berry-600">
              
                <SmileIcon className="h-5 w-5" />
              </button>
              <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder={`Message ${other?.name}`}
              aria-label="Message"
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border border-sand bg-cream px-4 py-3 text-[15px] text-ink placeholder:text-ink-muted/70 focus:border-berry-400 focus:outline-none focus:ring-2 focus:ring-berry-100" />
            
              <Button type="submit" className="h-11 w-11 shrink-0 px-0" aria-label="Send message">
                <SendIcon className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-2 text-center text-[12px] text-ink-muted">
              {entitlements.chatRemaining === null ?
            'Unlimited messages on your package' :
            `${entitlements.chatRemaining} messages remaining ,%V% each message you send uses one`}
            </p>
          </div>
        </div>
      }

      <Modal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={`About ${other?.name}`}
        description="Manage this conversation.">
        
        <div className="space-y-2">
          <Button
            variant="outline"
            block
            onClick={() => {
              setMenuOpen(false);
              navigate(`/profile/${otherId}`);
            }}>
            
            View full profile
          </Button>
          <Button
            variant="outline"
            block
            onClick={() => {
              setMenuOpen(false);
              setReporting(true);
            }}>
            
            <FlagIcon className="h-4 w-4" />
            Report {other?.name}
          </Button>
          <Button
            variant="danger"
            block
            onClick={() => {
              setMenuOpen(false);
              setBlocking(true);
            }}>
            
            <BanIcon className="h-4 w-4" />
            Block {other?.name}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this message?"
        description="It will be replaced with Message deleted for both of you."
        footer={
        <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
            variant="danger"
            onClick={() => {
              deleteMessage(pendingDelete as string);
              setPendingDelete(null);
              toast.success('Message deleted');
            }}>
            
              Delete
            </Button>
          </>
        } />
      

      <Modal
        open={blocking}
        onClose={() => setBlocking(false)}
        title={`Block ${other?.name}?`}
        description="This conversation will be closed and they will not be able to contact you again."
        footer={
        <>
            <Button variant="ghost" onClick={() => setBlocking(false)}>
              Cancel
            </Button>
            <Button
            variant="danger"
            onClick={() => {
              blockUser(otherId);
              toast.success(`${other?.name} blocked`);
              navigate('/messages');
            }}>
            
              Block
            </Button>
          </>
        } />
      

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        userId={otherId}
        userName={other?.name ?? 'this member'}
        context="chat" />
      
      <UpgradeDialog open={upgradeOpen} reason="chat_limit" onClose={() => setUpgradeOpen(false)} />
    </div>);

}
