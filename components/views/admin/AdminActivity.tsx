'use client';

import React from 'react';
import { AdminHeader, StatTile } from './AdminShell';
import { Badge } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { relativeTime } from '@/lib/utils/format';

export function AdminActivity() {
  const { db, freePackage } = useStore();

  const wingles = db.wingles;
  const accepted = wingles.filter((r) => r.status === 'accepted');
  const declined = wingles.filter((r) => r.status === 'declined');
  const acceptRate = wingles.length ?
  Math.round(accepted.length / (accepted.length + declined.length || 1) * 100) :
  0;

  const usageRows = db.users.
  filter((u) => u.role === 'member').
  map((user) => {
    const usage = db.usage.find((x) => x.userId === user.id);
    const sub = db.subscriptions.find(
      (s) => s.userId === user.id && s.status === 'active' && new Date(s.expiresAt) > new Date()
    );
    const pkg = sub ? db.packages.find((p) => p.id === sub.packageId) ?? freePackage : freePackage;
    const sent = db.mingles.filter((m) => m.senderId === user.id).length;
    return {
      user,
      pkg,
      chatUsed: usage?.chatUsed ?? 0,
      winglesUsed: usage?.winglesUsed ?? 0,
      sent
    };
  }).
  sort((a, b) => b.chatUsed - a.chatUsed);

  return (
    <div>
      <AdminHeader
        title="Wingles & chat"
        body="Wingle throughput, chat consumption per member, and abuse signals. Usage is metered server-side against each member's package." />
      

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total wingles" value={wingles.length} />
        <StatTile label="Accepted" value={accepted.length} hint={`${acceptRate}% accept rate`} />
        <StatTile label="Mingles sent" value={db.mingles.length} emphasis />
        <StatTile
          label="Blocks"
          value={db.blocks.length}
          hint={`${db.reports.filter((r) => r.context === 'chat').length} chat reports`} />
        
      </div>

      <section className="mt-8 overflow-hidden rounded-4xl bg-cream-deep shadow-card">
        <h2 className="border-b border-sand px-5 py-4 font-display text-xl text-ink">
          Chat usage by member
        </h2>
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-sand text-[12px] uppercase tracking-[0.06em] text-ink-muted">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Member</th>
              <th scope="col" className="px-5 py-3 font-semibold">Package</th>
              <th scope="col" className="px-5 py-3 font-semibold">Mingles used</th>
              <th scope="col" className="hidden px-5 py-3 font-semibold md:table-cell">Wingles used</th>
              <th scope="col" className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {usageRows.map((row) => {
              const exhausted =
              row.pkg.chatLimit !== null && row.chatUsed >= row.pkg.chatLimit;
              return (
                <tr key={row.user.id}>
                  <td className="px-5 py-3.5">
                    <span className="block font-medium text-ink">{row.user.name}</span>
                    <span className="block text-[12px] text-ink-muted">
                      Active {relativeTime(row.user.lastActiveAt)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{row.pkg.name}</td>
                  <td className="px-5 py-3.5 text-ink-soft">
                    {row.chatUsed} / {row.pkg.chatLimit === null ? '∞' : row.pkg.chatLimit}
                  </td>
                  <td className="hidden px-5 py-3.5 text-ink-soft md:table-cell">
                    {row.winglesUsed} / {row.pkg.wingleLimit === null ? '∞' : row.pkg.wingleLimit}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={exhausted ? 'red' : 'moss'}>
                      {exhausted ? 'Limit reached' : 'Within limit'}
                    </Badge>
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </section>

      <section className="mt-5 overflow-hidden rounded-4xl bg-cream-deep shadow-card">
        <h2 className="border-b border-sand px-5 py-4 font-display text-xl text-ink">
          Recent wingles
        </h2>
        <ul className="divide-y divide-sand">
          {[...wingles].
          sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).
          slice(0, 10).
          map((wingle) => {
            const from = db.users.find((u) => u.id === wingle.fromUserId);
            const to = db.users.find((u) => u.id === wingle.toUserId);
            return (
              <li key={wingle.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-ink">
                      {from?.name ?? 'Member'} → {to?.name ?? 'Member'}
                    </p>
                    <p className="truncate text-[12px] text-ink-muted">
                      {wingle.note || 'No note'} · {relativeTime(wingle.createdAt)}
                    </p>
                  </div>
                  <Badge
                  tone={
                  wingle.status === 'accepted' ?
                  'moss' :
                  wingle.status === 'declined' ?
                  'red' :
                  'amber'
                  }>
                  
                    {wingle.status}
                  </Badge>
                </li>);

          })}
        </ul>
      </section>
    </div>);

}
