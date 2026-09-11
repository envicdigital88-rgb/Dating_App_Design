'use client';

import React from 'react';
import { AdminHeader, StatTile } from './AdminShell';
import { Badge } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { money, relativeTime } from '@/lib/utils/format';

export function AdminOverview() {
  const { db } = useStore();

  const members = db.users.filter((u) => u.role === 'member');
  const activeToday = members.filter(
    (u) => Date.now() - new Date(u.lastActiveAt).getTime() < 86_400_000
  );
  const newThisMonth = members.filter(
    (u) => Date.now() - new Date(u.createdAt).getTime() < 30 * 86_400_000
  );
  const acceptedRequests = db.requests.filter((r) => r.status === 'accepted');
  const succeeded = db.payments.filter((p) => p.status === 'succeeded');
  const revenue = succeeded.reduce((total, p) => total + p.amount, 0);
  const activeSubs = db.subscriptions.filter(
    (s) => s.status === 'active' && new Date(s.expiresAt) > new Date()
  );

  const popular = db.packages.
  map((pkg) => ({
    pkg,
    count: succeeded.filter((p) => p.packageId === pkg.id).length
  })).
  sort((a, b) => b.count - a.count);

  const maxCount = Math.max(1, ...popular.map((p) => p.count));

  return (
    <div>
      <AdminHeader
        title="Overview"
        body="Live platform activity. Every figure is read from stored records, not cached counters." />
      

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total members" value={members.length} hint={`${newThisMonth.length} new this month`} />
        <StatTile label="Active in last 24h" value={activeToday.length} />
        <StatTile
          label="Revenue"
          value={money(revenue)}
          hint={`${succeeded.length} successful payments`}
          emphasis />
        
        <StatTile label="Active subscriptions" value={activeSubs.length} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Dating requests"
          value={db.requests.length}
          hint={`${acceptedRequests.length} accepted`} />
        
        <StatTile label="Messages sent" value={db.messages.length} />
        <StatTile label="Connections" value={db.connections.length} />
        <StatTile
          label="Open reports"
          value={db.reports.filter((r) => r.status === 'open').length}
          hint={`${db.reports.length} total`} />
        
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-4xl bg-cream-deep p-6 shadow-card">
          <h2 className="font-display text-xl text-ink">Package performance</h2>
          <ul className="mt-5 space-y-4">
            {popular.map(({ pkg, count }) =>
            <li key={pkg.id}>
                <div className="flex items-baseline justify-between gap-4 text-[14px]">
                  <span className="font-medium text-ink">{pkg.name}</span>
                  <span className="text-ink-muted">
                    {count} sold · {money(pkg.price * count)}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-deep">
                  <div
                  className="h-full rounded-full bg-berry-500 transition-[width] duration-300 ease-soft"
                  style={{ width: `${count / maxCount * 100}%` }} />
                
                </div>
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-4xl bg-cream-deep p-6 shadow-card">
          <h2 className="font-display text-xl text-ink">Latest activity</h2>
          <ul className="mt-4 divide-y divide-sand">
            {[...db.requests].
            sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).
            slice(0, 6).
            map((request) => {
              const from = db.users.find((u) => u.id === request.fromUserId);
              const to = db.users.find((u) => u.id === request.toUserId);
              return (
                <li key={request.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] text-ink">
                        {from?.name ?? 'Member'} → {to?.name ?? 'Member'}
                      </p>
                      <p className="text-[12px] text-ink-muted">
                        Request · {relativeTime(request.createdAt)}
                      </p>
                    </div>
                    <Badge
                    tone={
                    request.status === 'accepted' ?
                    'moss' :
                    request.status === 'declined' ?
                    'red' :
                    'amber'
                    }>
                    
                      {request.status}
                    </Badge>
                  </li>);

            })}
          </ul>
        </section>
      </div>
    </div>);

}
