'use client';

import React, { useState } from 'react';
import { AdminHeader, StatTile } from './AdminShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { money, shortDate } from '@/lib/utils/format';
import type { Payment } from '@/lib/types';

export function AdminPayments() {
  const { db, refundPayment } = useStore();
  const [filter, setFilter] = useState<'all' | Payment['status']>('all');

  const payments = [...db.payments].
  sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).
  filter((p) => filter === 'all' ? true : p.status === filter);

  const succeeded = db.payments.filter((p) => p.status === 'succeeded');
  const revenue = succeeded.reduce((total, p) => total + p.amount, 0);
  const refunded = db.payments.filter((p) => p.status === 'refunded');
  const activeSubs = db.subscriptions.filter(
    (s) => s.status === 'active' && new Date(s.expiresAt) > new Date()
  );
  const expiredSubs = db.subscriptions.filter(
    (s) => s.status !== 'active' || new Date(s.expiresAt) <= new Date()
  );

  return (
    <div>
      <AdminHeader
        title="Payments & subscriptions"
        body="Every charge is verified server-side before a package is activated. Refunds revoke nothing retroactively — end the subscription separately if needed." />
      

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Revenue" value={money(revenue)} hint={`${succeeded.length} payments`} emphasis />
        <StatTile
          label="Failed payments"
          value={db.payments.filter((p) => p.status === 'failed').length} />
        
        <StatTile
          label="Refunds"
          value={refunded.length}
          hint={money(refunded.reduce((t, p) => t + p.amount, 0))} />
        
        <StatTile
          label="Subscriptions"
          value={activeSubs.length}
          hint={`${expiredSubs.length} expired or cancelled`} />
        
      </div>

      <div className="mb-5 mt-8 inline-flex rounded-full bg-cream-deep p-1">
        {(['all', 'succeeded', 'failed', 'refunded'] as const).map((key) =>
        <button
          key={key}
          onClick={() => setFilter(key)}
          className={`rounded-full px-4 py-1.5 text-[13px] capitalize transition-colors duration-150 ease-soft ${
          filter === key ? 'bg-cream-deep text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`
          }>
          
            {key}
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-4xl bg-cream-deep shadow-card">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead className="border-b border-sand text-[12px] uppercase tracking-[0.06em] text-ink-muted">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Reference</th>
              <th scope="col" className="px-5 py-3 font-semibold">Member</th>
              <th scope="col" className="px-5 py-3 font-semibold">Package</th>
              <th scope="col" className="px-5 py-3 font-semibold">Amount</th>
              <th scope="col" className="px-5 py-3 font-semibold">Date</th>
              <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {payments.map((payment) => {
              const user = db.users.find((u) => u.id === payment.userId);
              const pkg = db.packages.find((p) => p.id === payment.packageId);
              return (
                <tr key={payment.id}>
                  <td className="px-5 py-3.5 font-mono text-[13px] text-ink">{payment.reference}</td>
                  <td className="px-5 py-3.5">
                    <span className="block text-ink">{user?.name ?? 'Deleted member'}</span>
                    <span className="block text-[12px] text-ink-muted">{payment.method}</span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{pkg?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{money(payment.amount)}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{shortDate(payment.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      tone={
                      payment.status === 'succeeded' ?
                      'moss' :
                      payment.status === 'failed' ?
                      'red' :
                      'amber'
                      }>
                      
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {payment.status === 'succeeded' &&
                    <Button size="sm" variant="outline" onClick={() => refundPayment(payment.id)}>
                        Refund
                      </Button>
                    }
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
        {payments.length === 0 &&
        <p className="px-5 py-10 text-center text-[14px] text-ink-muted">
            No payments with that status.
          </p>
        }
      </div>

      <section className="mt-5 overflow-hidden rounded-4xl bg-cream-deep shadow-card">
        <h2 className="border-b border-sand px-5 py-4 font-display text-xl text-ink">Subscriptions</h2>
        {db.subscriptions.length === 0 ?
        <p className="px-5 py-8 text-[14px] text-ink-muted">
            No subscriptions have been activated yet. Buying a package from the member view will
            create one here.
          </p> :

        <ul className="divide-y divide-sand">
            {db.subscriptions.map((sub) => {
            const user = db.users.find((u) => u.id === sub.userId);
            const pkg = db.packages.find((p) => p.id === sub.packageId);
            const live = sub.status === 'active' && new Date(sub.expiresAt) > new Date();
            return (
              <li key={sub.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-ink">
                      {user?.name ?? 'Member'} · {pkg?.name ?? 'Package'}
                    </p>
                    <p className="text-[12px] text-ink-muted">
                      {shortDate(sub.startedAt)} → {shortDate(sub.expiresAt)}
                    </p>
                  </div>
                  <Badge tone={live ? 'moss' : 'neutral'}>{live ? 'Active' : sub.status}</Badge>
                </li>);

          })}
          </ul>
        }
      </section>
    </div>);

}
