'use client';

import { useEffect, useMemo, useState } from 'react';
import { CoinsIcon } from 'lucide-react';
import { mingleTime } from '@/lib/utils/format';
import type { Mingle } from '@/lib/types';
import { WINGITS_CHAT_CHANGED, type WingitsChatEvent } from '@/lib/wingits-chat-events';

export function useWingitsChatTimeline(conversationId: string | undefined, mingles: Mingle[]) {
  const [snapshot, setSnapshot] = useState<{ conversationId: string; events: WingitsChatEvent[] }>();
  useEffect(() => {
    if (!conversationId) return;
    const controller = new AbortController();
    let loading = false;
    let queued = false;
    const load = async () => {
      if (controller.signal.aborted || document.hidden) return;
      if (loading) { queued = true; return; }
      loading = true;
      try {
        const response = await fetch('/api/chat/' + encodeURIComponent(conversationId) + '/wingits', {
          cache: 'no-store', signal: controller.signal,
        });
        const events = response.ok ? (await response.json()).events as WingitsChatEvent[] :
          [401, 403, 404].includes(response.status) ? [] : undefined;
        if (events && !controller.signal.aborted) setSnapshot({ conversationId, events });
      } catch {
        // The next refresh can recover without clearing the timeline.
      } finally {
        loading = false;
        if (queued) { queued = false; void load(); }
      }
    };
    const onChange = (event: Event) => {
      if ((event as CustomEvent<string>).detail === conversationId) void load();
    };
    void load();
    const timer = window.setInterval(load, 15_000);
    document.addEventListener('visibilitychange', load);
    window.addEventListener(WINGITS_CHAT_CHANGED, onChange);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
      window.removeEventListener(WINGITS_CHAT_CHANGED, onChange);
    };
  }, [conversationId]);

  return useMemo(() => {
    const events = snapshot?.conversationId === conversationId ? snapshot?.events ?? [] : [];
    return [...mingles, ...events].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }, [conversationId, mingles, snapshot]);
}

export function WingitsChatNotice({ event, mine }: { event: WingitsChatEvent; mine: boolean }) {
  const requested = event.kind === 'wingits_request';
  const label = requested
    ? (mine ? 'You requested ' : 'Requested ') + event.amount + ' Wingits'
    : (mine ? 'You sent ' + event.amount + ' Wingits' : 'You received ' + event.amount + ' Wingits');
  return (
    <div className="my-2 flex justify-center">
      <div className="flex max-w-full items-center gap-2 rounded-2xl border border-sand bg-cream-deep px-3 py-2 text-sm text-ink">
        <CoinsIcon className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        <span>{label}</span>
        <time dateTime={event.createdAt} className="shrink-0 text-[11px] text-ink-muted">{mingleTime(event.createdAt)}</time>
      </div>
    </div>
  );
}
