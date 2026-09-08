import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckIcon, LockIcon, SendIcon, SparklesIcon, XIcon } from 'lucide-react';
import { Page, PageHeader } from '../components/AppShell';
import { Button } from '../components/ui/Button';
import { Badge, EmptyState } from '../components/ui/Bits';
import { UpgradeDialog } from '../components/UpgradeDialog';
import { useStore } from '../contexts/StoreContext';
import { relativeTime, shortDate } from '../utils/format';
import type { DatingRequest } from '../types';

export function Requests() {
  const navigate = useNavigate();
  const {
    sentRequests,
    incomingRequests,
    entitlements,
    userById,
    photosOf,
    respondToRequest
  } = useStore();
  const [tab, setTab] = useState<'incoming' | 'sent'>('incoming');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!entitlements) return null;

  const sent = sentRequests();
  const incoming = incomingRequests();
  const pendingIncoming = incoming.filter((r) => r.status === 'pending');
  const unlocked = entitlements.incomingRequestsUnlocked;

  const statusTone = (status: DatingRequest['status']) =>
  status === 'accepted' ? 'moss' : status === 'declined' ? 'red' : 'amber';

  return (
    <Page>
      <PageHeader
        title="Dating requests"
        body="Everything you have sent, and everyone who has asked to meet you."
        action={
        !unlocked ?
        <Button onClick={() => setUpgradeOpen(true)}>
              <SparklesIcon className="h-4 w-4" />
              Unlock incoming requests
            </Button> :
        undefined
        } />
      

      <div
        role="tablist"
        aria-label="Request direction"
        className="mb-6 inline-flex rounded-full bg-cream-deep p-1">
        
        {(
        [
        ['incoming', `Incoming${pendingIncoming.length ? ` · ${pendingIncoming.length}` : ''}`],
        ['sent', `Sent · ${sent.length}`]] as
        const).
        map(([key, label]) =>
        <button
          key={key}
          role="tab"
          aria-selected={tab === key}
          onClick={() => setTab(key)}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-[background-color,color] duration-150 ease-soft ${
          tab === key ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`
          }>
          
            {label}
          </button>
        )}
      </div>

      {tab === 'incoming' &&
      <div className="max-w-3xl">
          {incoming.length === 0 ?
        <EmptyState
          icon={<SendIcon className="h-5 w-5" />}
          title="No requests yet"
          body="When someone asks to meet you, it will appear here. A stronger main photo and a specific bio make a real difference."
          action={<Button onClick={() => navigate('/app/photos')}>Review my photos</Button>} /> :


        <ul className="space-y-3">
              {incoming.map((request) => {
            const sender = userById(request.fromUserId);
            const photo = sender ? photosOf(sender.id)[0] : undefined;
            if (!sender) return null;

            if (!unlocked) {
              return (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center gap-4 rounded-4xl bg-white p-4 shadow-card sm:p-5">
                  
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-cream-deep">
                        {photo &&
                    <img
                      src={photo.url}
                      alt=""
                      aria-hidden
                      className="h-full w-full scale-110 object-cover blur-[12px]" />

                    }
                        <span className="absolute inset-0 flex items-center justify-center bg-plum-500/25 text-white">
                          <LockIcon className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[19px] leading-tight text-ink">
                          Someone wants to connect with you ❤
                        </p>
                        <p className="mt-1 text-[13px] text-ink-soft">
                          Sent {relativeTime(request.createdAt)} · upgrade your package to see who
                          sent this request.
                        </p>
                        <p className="mt-2 rounded-2xl bg-cream px-3.5 py-2 text-[13px] text-ink-muted">
                          “{request.note.slice(0, 14)}
                          {request.note.length > 14 ? ' ▒▒▒▒▒▒▒▒▒▒' : ''}”
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setUpgradeOpen(true)}>
                        Reveal
                      </Button>
                    </li>);

            }

            return (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-4 rounded-4xl bg-white p-4 shadow-card sm:p-5">
                
                    <button
                  onClick={() => navigate(`/app/profile/${sender.id}`)}
                  className="shrink-0"
                  aria-label={`View ${sender.name}'s profile`}>
                  
                      {photo &&
                  <img src={photo.url} alt="" className="h-20 w-20 rounded-3xl object-cover" />
                  }
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-[19px] leading-tight text-ink">
                          {sender.name}, {sender.age}
                        </p>
                        <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                      </div>
                      <p className="mt-1 text-[13px] text-ink-soft">
                        {sender.location} · sent {relativeTime(request.createdAt)}
                      </p>
                      {request.note &&
                  <p className="mt-2 rounded-2xl bg-cream px-3.5 py-2 text-[13px] leading-relaxed text-ink-soft">
                          “{request.note}”
                        </p>
                  }
                    </div>
                    {request.status === 'pending' ?
                <div className="flex gap-2">
                        <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      respondToRequest(request.id, 'declined');
                      toast.success('Request declined');
                    }}>
                    
                          <XIcon className="h-3.5 w-3.5" />
                          Decline
                        </Button>
                        <Button
                    size="sm"
                    onClick={() => {
                      respondToRequest(request.id, 'accepted');
                      toast.success(`You are connected with ${sender.name}`);
                    }}>
                    
                          <CheckIcon className="h-3.5 w-3.5" />
                          Accept
                        </Button>
                      </div> :

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/app/profile/${sender.id}`)}>
                  
                        View profile
                      </Button>
                }
                  </li>);

          })}
            </ul>
        }

          {!unlocked && incoming.length > 0 &&
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-4xl bg-plum-500 p-5 text-cream">
              <div>
                <p className="font-display text-xl">
                  {pendingIncoming.length} {pendingIncoming.length === 1 ? 'person' : 'people'} asked
                  to meet you
                </p>
                <p className="mt-1 text-[14px] text-cream/75">
                  Upgrade to Basic or Premium to see who they are and reply.
                </p>
              </div>
              <Button
            className="bg-cream text-plum-500 hover:bg-white"
            onClick={() => navigate('/app/packages')}>
            
                See packages
              </Button>
            </div>
        }
        </div>
      }

      {tab === 'sent' &&
      <div className="max-w-3xl">
          {sent.length === 0 ?
        <EmptyState
          icon={<SendIcon className="h-5 w-5" />}
          title="You have not sent any requests"
          body="Requests with a specific note get replies far more often. Head to Discover and pick someone worth writing to."
          action={<Button onClick={() => navigate('/app/discover')}>Discover people</Button>} /> :


        <ul className="space-y-3">
              {sent.map((request) => {
            const target = userById(request.toUserId);
            const photo = target ? photosOf(target.id)[0] : undefined;
            if (!target) return null;
            return (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-4 rounded-4xl bg-white p-4 shadow-card sm:p-5">
                
                    {photo &&
                <img src={photo.url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                }
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[18px] leading-tight text-ink">
                        {target.name}, {target.age}
                      </p>
                      <p className="mt-1 text-[13px] text-ink-soft">
                        Sent {shortDate(request.createdAt)} · {relativeTime(request.createdAt)}
                      </p>
                    </div>
                    <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                    {request.status === 'accepted' &&
                <Button size="sm" onClick={() => navigate('/app/messages')}>
                        Open chat
                      </Button>
                }
                  </li>);

          })}
            </ul>
        }
        </div>
      }

      <UpgradeDialog
        open={upgradeOpen}
        reason="incoming_locked"
        onClose={() => setUpgradeOpen(false)} />
      
    </Page>);

}