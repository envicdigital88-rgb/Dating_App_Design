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
  Trash2Icon,
  ForwardIcon,
  CornerUpLeftIcon,
  InfoIcon,
  XIcon,
  EyeIcon,
  EyeOffIcon,
  CropIcon,
  StickerIcon,
  TypeIcon,
  PenToolIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, Badge } from '@/components/ui/Bits';
import { Modal } from '@/components/ui/Modal';
import { ReportDialog } from '@/components/ReportDialog';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { useStore } from '@/lib/contexts/StoreContext';
import { dayLabel, mingleTime, presence } from '@/lib/utils/format';
import { processPhoto, screenPhoto, getCroppedImg } from '@/lib/utils/image';
import EmojiPicker from 'emoji-picker-react';
import Cropper from 'react-easy-crop';

export function Chat() {
  const { conversationId } = useParams();
  const router = useRouter();
  const navigate = router.push;
  const {
    db,
    currentUser,
    entitlements,
    minglesOf,
    sendMingle,
    markConversationRead,
    deleteMingle,
    reactToMingle,
    forwardMingles,
    userById,
    photosOf,
    blockUser,
    typingIn,
    conversationsOf
  } = useStore();

  const [draft, setDraft] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  
  // New WhatsApp Features State
  const [selectedMingles, setSelectedMingles] = useState<string[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [lightboxMingleId, setLightboxMingleId] = useState<string | null>(null);
  const [activeMingleId, setActiveMingleId] = useState<string | null>(null);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [infoModalMingle, setInfoModalMingle] = useState<string | null>(null);
  const [reactionMingleId, setReactionMingleId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<{ url: string; file: File; isCropping: boolean; crop: any; zoom: number; croppedAreaPixels: any }[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [previewCaption, setPreviewCaption] = useState('');
  const [viewOnce, setViewOnce] = useState(false);
  const [showPreviewEmoji, setShowPreviewEmoji] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const conversation = db.conversations.find((c) => c.id === conversationId);
  const mingles = useMemo(
    () => conversation ? minglesOf(conversation.id) : [],
    [conversation, minglesOf, db.mingles]
  );

  useEffect(() => {
    if (conversation) markConversationRead(conversation.id);
  }, [conversation, mingles.length, markConversationRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mingles.length, typingIn]);

  if (!conversation || !currentUser || !entitlements) { redirect("/mingles"); return null as any; }

  const otherId = conversation.userIds.find((uid) => uid !== currentUser.id) as string;
  const other = userById(otherId);
  const photo = photosOf(otherId)[0];
  const limitReached = entitlements.chatRemaining !== null && entitlements.chatRemaining <= 0;

  const submit = (imageUrl?: string) => {
    if (!imageUrl && !draft.trim()) return;

    const hasNumbersRegex = /\d/;
    if (hasNumbersRegex.test(draft)) {
      toast.error('Sharing numbers is not allowed for privacy reasons.');
      return;
    }

    const result = sendMingle(conversation.id, draft, imageUrl, replyToId, false);
    if (!result.ok) {
      if (result.reason === 'chat_limit') setUpgradeOpen(true);
      else toast.error(result.error);
      return;
    }
    setDraft('');
    setShowEmoji(false);
    setReplyToId(null);
  };

  const attach = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => {
      const { ok, error } = screenPhoto(f);
      if (!ok) toast.error(error);
      return ok;
    });
    if (validFiles.length === 0) return;

    const newPreviews = await Promise.all(validFiles.map(file => {
      return new Promise<any>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({ 
            url: e.target?.result as string, 
            file,
            isCropping: false,
            crop: { x: 0, y: 0 },
            zoom: 1,
            croppedAreaPixels: null
          });
        };
        reader.readAsDataURL(file);
      });
    }));

    setImagePreviews(prev => {
      const updated = [...prev, ...newPreviews];
      if (prev.length === 0) setActivePreviewIndex(0);
      return updated;
    });
  };

  const submitPreview = async () => {
    if (imagePreviews.length === 0 || !conversation) return;
    
    for (let i = 0; i < imagePreviews.length; i++) {
      const preview = imagePreviews[i];
      let url = preview.url;
      if (preview.isCropping && preview.croppedAreaPixels) {
        url = await getCroppedImg(preview.url, preview.croppedAreaPixels);
      } else {
        url = await processPhoto(preview.file, { maxWidth: 720, quality: 0.75, cropToProfile: false });
      }
      
      const body = i === 0 ? previewCaption : '';
      const res = sendMingle(conversation.id, body, url, i === 0 ? replyToId : null, false, viewOnce);
      if (!res.ok) toast.error(res.error as string);
    }

    setImagePreviews([]);
    setPreviewCaption('');
    setViewOnce(false);
    setShowPreviewEmoji(false);
    setReplyToId(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleSelect = (id: string) => {
    setSelectedMingles(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    // We can show delete modal for selected
    if (selectedMingles.length === 1) {
      setPendingDelete(selectedMingles[0]);
    } else {
      // Bulk delete for everyone (not fully supported yet, so just bulk delete for me?)
      // Let's just reset for now.
      setSelectedMingles([]);
      toast.info('Bulk delete not fully implemented yet');
    }
  };

  let lastDay = '';

  const activeMingle = mingles.find(m => m.id === activeMingleId);
  const infoMingle = mingles.find(m => m.id === infoModalMingle);

  return (
    <div className="flex h-[100dvh] flex-col bg-cream">
      {/* Header */}
      {selectedMingles.length > 0 ? (
        <header className="flex items-center justify-between border-b border-sand/70 bg-berry-50 px-3 py-2.5 sm:px-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedMingles([])} className="p-2 text-ink">
              <XIcon className="h-5 w-5" />
            </button>
            <span className="font-medium text-ink">{selectedMingles.length} Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setForwardModalOpen(true)} className="p-2 text-ink transition-colors hover:text-berry-600">
              <ForwardIcon className="h-5 w-5" />
            </button>
            <button onClick={handleDeleteSelected} className="p-2 text-ink transition-colors hover:text-red-500">
              <Trash2Icon className="h-5 w-5" />
            </button>
          </div>
        </header>
      ) : (
        <header className="flex items-center gap-3 border-b border-sand/70 bg-cream-deep px-3 py-2.5 sm:px-5">
          <button
            onClick={() => navigate('/mingles')}
            aria-label="Back to mingles"
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
                {typingIn === conversation.id ? 'Typing ' : other ? presence(other.online, other.lastActiveAt) : ''}
              </span>
            </span>
          </button>
          <span className="hidden sm:block">
            <Badge tone={limitReached ? 'red' : 'neutral'}>
              {entitlements.chatRemaining === null ? 'Unlimited' : `${entitlements.chatRemaining} left`}
            </Badge>
          </span>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Conversation options"
            className="rounded-full p-2 text-ink-soft transition-colors duration-150 ease-soft hover:bg-cream">
            <MoreVerticalIcon className="h-5 w-5" />
          </button>
        </header>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-6 relative">
        <div className="mx-auto max-w-2xl space-y-2">
          {mingles.map((mingle) => {
            if (mingle.deletedFor?.includes(currentUser.id) && !mingle.viewOnce) return null;
            const mine = mingle.senderId === currentUser.id;
            const day = dayLabel(mingle.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;
            const isSelected = selectedMingles.includes(mingle.id);
            const replyMsg = mingle.replyToId ? mingles.find(m => m.id === mingle.replyToId) : null;
            
            return (
              <React.Fragment key={mingle.id}>
                {showDay && <p className="py-3 text-center text-[12px] font-medium text-ink-muted">{day}</p>}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className={`group flex items-center gap-2 ${mine ? 'justify-end' : 'justify-start'} ${isSelected ? 'bg-berry-50/50 -mx-3 px-3 py-1' : ''}`}
                >
                  
                  {selectedMingles.length > 0 && (
                    <div className="mr-2" onClick={() => toggleSelect(mingle.id)}>
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-berry-500 border-berry-500' : 'border-sand'}`}>
                        {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                  )}

                  <div 
                    onClick={() => {
                      if (selectedMingles.length > 0) toggleSelect(mingle.id);
                      else setActiveMingleId(mingle.id);
                    }}
                    className={`relative max-w-[78%] rounded-3xl cursor-pointer ${
                    mingle.deleted ?
                    'border border-dashed border-sand bg-cream-deep text-ink-muted px-4 py-2.5' :
                    (mingle.imageUrl && !mingle.body) ?
                    'p-1 bg-transparent' :
                    mine ?
                    'bg-berry-500 text-white px-4 py-2.5' :
                    'bg-cream-deep text-ink shadow-sm px-4 py-2.5'}`
                    }>
                    
                    {mingle.deleted ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">🚫</span>
                        <p className="text-[13px] italic">{mine ? 'You deleted this message' : 'This message was deleted'}</p>
                      </div>
                    ) : (
                      <>
                        {mingle.forwarded && (
                          <div className="flex items-center gap-1 text-[11px] italic opacity-80 mb-1">
                            <ForwardIcon className="h-3 w-3" /> Forwarded
                          </div>
                        )}
                        
                        {replyMsg && (
                          <div className={`mb-2 p-2 rounded-xl text-sm ${mine ? 'bg-black/10' : 'bg-black/5'} border-l-2 ${mine ? 'border-white' : 'border-berry-400'}`}>
                            <p className="font-semibold text-[11px] opacity-80">
                              {replyMsg.senderId === currentUser.id ? 'You' : other?.name}
                            </p>
                            <p className="line-clamp-2 text-xs opacity-90">{replyMsg.body || 'Photo'}</p>
                          </div>
                        )}

                        {mingle.imageUrl && (
                          <div className="relative">
                            {mingle.viewOnce ? (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!mine && !mingle.deletedFor?.includes(currentUser.id)) {
                                    setLightboxMingleId(mingle.id);
                                    if (mingle.viewOnce) {
                                      deleteMingle(mingle.id, 'me');
                                    }
                                  }
                                }}
                                className={`flex items-center gap-2 p-3 bg-black/20 rounded-xl cursor-pointer ${mingle.body ? 'mb-2' : ''}`}
                              >
                                {mine || mingle.deletedFor?.includes(currentUser.id) ? <EyeOffIcon className="h-5 w-5 opacity-50" /> : <EyeIcon className="h-5 w-5" />}
                                <span className="font-semibold italic opacity-90 text-[14px]">
                                  {(mine && mingle.deletedFor?.length) || (!mine && mingle.deletedFor?.includes(currentUser.id)) ? 'Opened' : 'Photo'}
                                </span>
                              </div>
                            ) : (
                              <img
                                src={mingle.imageUrl}
                                alt="Shared photo"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setLightboxMingleId(mingle.id); 
                                  if (mingle.viewOnce) {
                                    deleteMingle(mingle.id, 'me');
                                  }
                                }}
                                className={`max-h-72 max-w-full object-contain rounded-2xl cursor-zoom-in ${mingle.body ? 'mb-2' : ''}`} 
                              />
                            )}
                            
                            {!mingle.body && (
                              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-sm">
                                <span className="text-[11px] text-white/90">{mingleTime(mingle.createdAt)}</span>
                                {mine && (
                                  mingle.readAt ? (
                                    <CheckCheckIcon className="h-3.5 w-3.5 text-[#53bdeb]" />
                                  ) : mingle.deliveredAt ? (
                                    <CheckCheckIcon className="h-3.5 w-3.5 text-white/80" />
                                  ) : (
                                    <CheckIcon className="h-3 w-3 text-white/80" />
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {mingle.body && (
                          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                            {mingle.body}
                          </p>
                        )}
                        
                        {(mingle.body || mingle.deleted) && (
                          <div className="mt-1 flex flex-wrap items-center justify-end gap-1">
                            <p className={`flex items-center gap-1 text-[11px] ${mine ? 'text-white/70' : 'text-ink-muted'}`}>
                              {mingleTime(mingle.createdAt)}
                              {mine && (
                                mingle.readAt ? (
                                  <CheckCheckIcon className="h-4 w-4 text-[#53bdeb]" />
                                ) : mingle.deliveredAt ? (
                                  <CheckCheckIcon className="h-4 w-4 opacity-70" />
                                ) : (
                                  <CheckIcon className="h-3.5 w-3.5 opacity-70" />
                                )
                              )}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Reactions Display */}
                    {!mingle.deleted && mingle.reactions && Object.keys(mingle.reactions).length > 0 && (
                      <div className={`absolute -bottom-3 ${mine ? 'right-4' : 'left-4'} flex gap-1 z-10`}>
                        {Object.entries(mingle.reactions).map(([emoji, users]: [string, any]) => (
                          <button 
                            key={emoji}
                            onClick={(e) => { e.stopPropagation(); reactToMingle(mingle.id, emoji); }}
                            className={`rounded-full bg-cream shadow-sm border border-sand px-1.5 py-0.5 text-xs flex items-center gap-1 ${users.includes(currentUser.id) ? 'bg-berry-50 border-berry-200' : ''}`}
                          >
                            <span>{emoji}</span>
                            {users.length > 1 && <span className="text-[10px] text-ink-muted">{users.length}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}

          <AnimatePresence>
            {typingIn === conversation.id && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-1.5 rounded-3xl bg-cream-deep px-4 py-3 shadow-sm"
                style={{ width: 'fit-content' }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted"
                      style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef} className="pt-4" />
        </div>
      </div>

      {/* Input Area */}
      {limitReached ? (
        <div className="border-t border-sand/70 bg-cream-deep px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-4 rounded-4xl bg-plum-500 p-5 text-cream">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream/15">
              <LockIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg leading-tight">Your chat limit has been reached</p>
              <p className="mt-1 text-[13px] text-cream/75">
                You have used all {entitlements.chatLimit} mingles on the {entitlements.packageName} package. Upgrade to keep this conversation going.
              </p>
            </div>
            <Button variant="inverse" onClick={() => navigate('/packages')}>
              Upgrade package
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-sand/70 bg-cream-deep px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5">
          <div className="mx-auto max-w-2xl relative">
            
            {replyToId && (() => {
              const r = mingles.find(m => m.id === replyToId);
              return r ? (
                <div className="mb-2 bg-cream rounded-2xl p-3 flex justify-between items-start border border-sand">
                  <div className="border-l-4 border-berry-400 pl-2">
                    <p className="text-xs font-semibold text-berry-600">{r.senderId === currentUser.id ? 'You' : other?.name}</p>
                    <p className="text-sm text-ink-soft line-clamp-1">{r.body || 'Photo'}</p>
                  </div>
                  <button onClick={() => setReplyToId(null)} className="p-1 text-ink-muted hover:text-ink"><XIcon className="w-4 h-4"/></button>
                </div>
              ) : null;
            })()}

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
              onSubmit={(e) => { e.preventDefault(); submit(); }}
              className="flex items-end gap-2">
              
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => attach(e.target.files)} />
              
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sand text-ink-soft transition-colors hover:border-berry-300 hover:text-berry-600">
                <ImageIcon className="h-5 w-5" />
              </button>
              
              <button
                type="button"
                onClick={() => setShowEmoji((s) => !s)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sand text-ink-soft transition-colors hover:border-berry-300 hover:text-berry-600">
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
                placeholder={`Message`}
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border border-sand bg-cream px-4 py-3 text-[15px] text-ink placeholder:text-ink-muted/70 focus:border-berry-400 focus:outline-none focus:ring-2 focus:ring-berry-100" />
              
              <Button type="submit" className="h-11 w-11 shrink-0 px-0">
                <SendIcon className="h-4 w-4 text-plum-500" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Message Options Modal */}
      <Modal
        open={!!activeMingleId && !reactionMingleId}
        onClose={() => setActiveMingleId(null)}
        title="Message Options"
        description="What would you like to do with this message?"
      >
        {activeMingle && !activeMingle.deleted && (
          <div className="space-y-2">
            <Button variant="outline" block onClick={() => {
              setReactionMingleId(activeMingle.id);
            }}>
              <SmileIcon className="h-4 w-4 mr-2" /> React
            </Button>
            <Button variant="outline" block onClick={() => {
              setReplyToId(activeMingle.id);
              setActiveMingleId(null);
            }}>
              <CornerUpLeftIcon className="h-4 w-4 mr-2" /> Reply
            </Button>
            <Button variant="outline" block onClick={() => {
              toggleSelect(activeMingle.id);
              setActiveMingleId(null);
            }}>
              <CheckCheckIcon className="h-4 w-4 mr-2" /> Select
            </Button>
            <Button variant="outline" block onClick={() => {
              setForwardModalOpen(true);
              setSelectedMingles([activeMingle.id]);
              setActiveMingleId(null);
            }}>
              <ForwardIcon className="h-4 w-4 mr-2" /> Forward
            </Button>
            {activeMingle.senderId === currentUser.id && (
              <Button variant="outline" block onClick={() => {
                setInfoModalMingle(activeMingle.id);
                setActiveMingleId(null);
              }}>
                <InfoIcon className="h-4 w-4 mr-2" /> Message Info
              </Button>
            )}
            <Button variant="danger" block onClick={() => {
              setPendingDelete(activeMingle.id);
              setActiveMingleId(null);
            }}>
              <Trash2Icon className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        )}
      </Modal>

      {/* Reaction Emoji Modal */}
      <Modal
        open={!!reactionMingleId}
        onClose={() => { setReactionMingleId(null); setActiveMingleId(null); }}
        title="React"
        description="Choose a reaction"
      >
        <div className="flex justify-center">
          <EmojiPicker 
            onEmojiClick={(emojiData) => {
              if (reactionMingleId) reactToMingle(reactionMingleId, emojiData.emoji);
              setReactionMingleId(null);
              setActiveMingleId(null);
            }}
          />
        </div>
      </Modal>

      {/* Message Info Modal */}
      <Modal
        open={!!infoModalMingle}
        onClose={() => setInfoModalMingle(null)}
        title="Message Info"
        description="Delivery and read details"
      >
        {infoMingle && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-cream rounded-xl">
              <span className="font-medium text-ink">Sent</span>
              <span className="text-sm text-ink-muted">{new Date(infoMingle.createdAt).toLocaleString()}</span>
            </div>
            {infoMingle.deliveredAt && (
              <div className="flex items-center justify-between p-3 bg-cream rounded-xl">
                <span className="font-medium text-ink">Delivered</span>
                <span className="text-sm text-ink-muted">{new Date(infoMingle.deliveredAt).toLocaleString()}</span>
              </div>
            )}
            {infoMingle.readAt && (
              <div className="flex items-center justify-between p-3 bg-cream rounded-xl">
                <span className="font-medium text-ink">Read</span>
                <span className="text-sm text-ink-muted">{new Date(infoMingle.readAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Forward Modal */}
      <Modal
        open={forwardModalOpen}
        onClose={() => setForwardModalOpen(false)}
        title="Forward Message"
        description="Select conversations to forward to"
      >
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {conversationsOf().map(conv => {
            const uid = conv.userIds.find(id => id !== currentUser.id);
            const u = userById(uid!);
            if (!u) return null;
            return (
              <Button key={conv.id} variant="outline" block onClick={() => {
                forwardMingles(selectedMingles, [conv.id]);
                setForwardModalOpen(false);
                setSelectedMingles([]);
                toast.success('Message forwarded');
              }}>
                <Avatar src={photosOf(u.id)[0]?.url} name={u.name} size={24} />
                <span className="ml-2">{u.name}</span>
              </Button>
            );
          })}
        </div>
      </Modal>

      {/* Lightbox Modal */}
      {lightboxMingleId && (() => {
        const m = mingles.find(msg => msg.id === lightboxMingleId);
        if (!m || !m.imageUrl) return null;
        return (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => {
              setLightboxMingleId(null);
            }}
          >
            <button 
              className="absolute top-4 right-4 text-white p-2"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxMingleId(null);
              }}
            >
              <XIcon className="h-6 w-6" />
            </button>
            <img src={m.imageUrl} className="max-w-full max-h-full object-contain" alt="Fullscreen" />
          </div>
        );
      })()}

      {/* Existing Modals */}
      <Modal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={`About ${other?.name}`}
        description="Manage this conversation.">
        <div className="space-y-2">
          <Button variant="outline" block onClick={() => { setMenuOpen(false); navigate(`/profile/${otherId}`); }}>
            View full profile
          </Button>
          <Button variant="outline" block onClick={() => { setMenuOpen(false); setReporting(true); }}>
            <FlagIcon className="h-4 w-4" /> Report {other?.name}
          </Button>
          <Button variant="danger" block onClick={() => { setMenuOpen(false); setBlocking(true); }}>
            <BanIcon className="h-4 w-4" /> Block {other?.name}
          </Button>
        </div>
      </Modal>

      <Modal
        open={blocking}
        onClose={() => setBlocking(false)}
        title={`Block ${other?.name}?`}
        description="This conversation will be closed and they will not be able to contact you again."
        footer={
          <>
            <Button variant="ghost" onClick={() => setBlocking(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { blockUser(otherId); toast.success(`${other?.name} blocked`); navigate('/mingles'); }}>Block</Button>
          </>
        } />
      <ReportDialog open={reporting} onClose={() => setReporting(false)} userId={otherId} userName={other?.name ?? 'this member'} context="chat" />
      <UpgradeDialog open={upgradeOpen} reason="chat_limit" onClose={() => setUpgradeOpen(false)} />
      
      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete message?"
        description="Choose how you want to delete this message."
        footer={
          <div className="flex flex-col gap-2 w-full">
            {mingles.find(m => m.id === pendingDelete)?.senderId === currentUser.id && (
              <Button variant="danger" block onClick={() => { deleteMingle(pendingDelete as string, 'everyone'); setPendingDelete(null); }}>Delete for Everyone</Button>
            )}
            <Button variant="danger" block onClick={() => { deleteMingle(pendingDelete as string, 'me'); setPendingDelete(null); }}>Delete for Me</Button>
            <Button variant="ghost" block onClick={() => setPendingDelete(null)}>Cancel</Button>
          </div>
        } 
      />

      {imagePreviews.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-[#0b141a] flex flex-col w-full overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 bg-transparent text-white z-50">
            <button onClick={() => { setImagePreviews([]); setPreviewCaption(''); setViewOnce(false); setShowPreviewEmoji(false); if (fileRef.current) fileRef.current.value = ''; }}>
              <XIcon className="h-7 w-7" />
            </button>
            <div className="flex items-center gap-6">
              <button onClick={() => {
                setImagePreviews(prev => prev.map((p, i) => i === activePreviewIndex ? { ...p, isCropping: !p.isCropping } : p));
              }}>
                <CropIcon className={`h-6 w-6 ${imagePreviews[activePreviewIndex].isCropping ? 'text-[#53bdeb]' : 'text-white'}`} />
              </button>
              <button onClick={() => toast.info('Stickers coming soon!')}><StickerIcon className="h-6 w-6" /></button>
              <button onClick={() => toast.info('Text overlay coming soon!')}><TypeIcon className="h-6 w-6" /></button>
              <button onClick={() => toast.info('Drawing coming soon!')}><PenToolIcon className="h-6 w-6" /></button>
            </div>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center min-h-0 overflow-hidden">
            {imagePreviews[activePreviewIndex].isCropping ? (
              <Cropper
                image={imagePreviews[activePreviewIndex].url}
                crop={imagePreviews[activePreviewIndex].crop}
                zoom={imagePreviews[activePreviewIndex].zoom}
                aspect={3 / 4}
                onCropChange={(crop) => setImagePreviews(prev => prev.map((p, i) => i === activePreviewIndex ? { ...p, crop } : p))}
                onZoomChange={(zoom) => setImagePreviews(prev => prev.map((p, i) => i === activePreviewIndex ? { ...p, zoom } : p))}
                onCropComplete={(_croppedArea, croppedAreaPixels) => setImagePreviews(prev => prev.map((p, i) => i === activePreviewIndex ? { ...p, croppedAreaPixels } : p))}
              />
            ) : (
              <img src={imagePreviews[activePreviewIndex].url} alt="Preview" className="max-w-full max-h-full object-contain" />
            )}
          </div>
          
          {/* Bottom Area */}
          <div className="bg-transparent flex flex-col gap-4 p-4 pb-6 w-full max-w-2xl mx-auto flex-shrink-0">
            <div className="relative flex items-center bg-[#2a2f32] rounded-3xl px-4 py-2 text-white min-h-[50px]">
              {showPreviewEmoji && (
                <div className="absolute bottom-[60px] right-0 mb-2 z-50 shadow-xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
                  <EmojiPicker 
                    onEmojiClick={(emojiData) => {
                      setPreviewCaption((d) => d + emojiData.emoji);
                    }}
                  />
                </div>
              )}
              <input
                type="text"
                placeholder={activePreviewIndex === 0 ? "Type a message" : "Caption is added to the first image"}
                value={activePreviewIndex === 0 ? previewCaption : ''}
                onChange={(e) => activePreviewIndex === 0 && setPreviewCaption(e.target.value)}
                disabled={activePreviewIndex !== 0}
                className="flex-1 bg-transparent text-white placeholder-white/60 focus:outline-none text-[15px] disabled:opacity-50"
                onKeyDown={(e) => { if (e.key === 'Enter') submitPreview(); }}
              />
              <div className="flex items-center gap-4 text-white/60 ml-2">
                <button 
                  onClick={() => setViewOnce(!viewOnce)} 
                  className={`flex items-center justify-center transition-colors ${viewOnce ? 'text-[#53bdeb]' : 'text-white/60'}`}
                >
                  <div className="w-5 h-5 rounded-full border-[1.5px] border-current flex items-center justify-center text-[10px] font-bold">1</div>
                </button>
                <button onClick={() => setShowPreviewEmoji(!showPreviewEmoji)}>
                  <SmileIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-1 items-center gap-3 overflow-x-auto overflow-y-hidden pb-1 px-1">
                {imagePreviews.map((preview, i) => (
                  <div 
                    key={i} 
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer ${i === activePreviewIndex ? 'border-white' : 'border-transparent'}`}
                    onClick={() => setActivePreviewIndex(i)}
                  >
                     <img src={preview.url} className="w-full h-full object-cover" />
                     <button 
                       className="absolute top-0 right-0 bg-black/50 text-white rounded-bl-lg p-0.5"
                       onClick={(e) => {
                         e.stopPropagation();
                         setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                         if (activePreviewIndex >= i && activePreviewIndex > 0) setActivePreviewIndex(activePreviewIndex - 1);
                       }}
                     >
                       <XIcon className="h-3 w-3" />
                     </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => fileRef.current?.click()}
                  className="w-12 h-12 rounded-lg border border-white/20 flex items-center justify-center text-white/60 bg-white/5 flex-shrink-0">
                  <span className="text-2xl font-light leading-none mb-1">+</span>
                </button>
              </div>
              
              <button
                onClick={submitPreview}
                className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white hover:bg-[#008f6f] shadow-lg flex-shrink-0 ml-4"
              >
                <SendIcon className="h-5 w-5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
