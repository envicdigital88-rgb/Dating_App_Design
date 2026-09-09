'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CreditCardIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge, EmptyState } from '@/components/ui/Bits';
import { UsageMeter } from '@/components/UsageMeter';
import { useStore } from '@/lib/contexts/StoreContext';
import { money, shortDate } from '@/lib/utils/format';

export function SubscriptionPage() {
  const router = useRouter();
  const { currentUser, entitlements, paymentsOf, db } = useStore();
  if (!currentUser || !entitlements) return null;

  const payments = paymentsOf(currentUser.id);

  return (
    <Page>
      <PageHeader
        title="Subscription"
        body="Your package, your remaining allowance, and every payment on your account."
        action={
        <Button onClick={() => router.push('/packages')}>
            {entitlements.subscriptionStatus === 'free' ? 'Choose a package' : 'Change package'}
          </Button>
        } />
      

      <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
        <div className="rounded-4xl bg-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Current package
              </p>
              <h2 className="mt-1.5 font-display text-3xl text-ink">{entitlements.packageName}</h2>
            </div>
            <Badge tone={entitlements.subscriptionStatus === 'active' ? 'moss' : 'neutral'}>
              {entitlements.subscriptionStatus === 'active' ? 'Active' : 'Free plan'}
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            <UsageMeter
              label="Chat messages remaining"
              used={entitlements.chatUsed}
              limit={entitlements.chatLimit} />
            
            <UsageMeter
              label="Dating requests remaining"
              used={entitlements.requestsUsed}
              limit={entitlements.requestLimit} />
            
          </div>

          <dl className="mt-6 divide-y divide-sand border-t border-sand text-[14px]">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Incoming requests</dt>
              <dd className="font-medium text-ink">
                {entitlements.incomingRequestsUnlocked ? 'Unlocked' : 'Locked'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Priority visibility</dt>
              <dd className="font-medium text-ink">
                {entitlements.priorityVisibility ? 'On' : 'Off'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Expires</dt>
              <dd className="font-medium text-ink">
                {entitlements.subscriptionExpiry ?
                shortDate(entitlements.subscriptionExpiry) :
                'No expiry on Free'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-4xl bg-white p-6 shadow-card">
          <h2 className="font-display text-xl text-ink">Payment history</h2>
          {payments.length === 0 ?
          <div className="mt-4">
              <EmptyState
              icon={<CreditCardIcon className="h-5 w-5" />}
              title="No payments yet"
              body="You are on the Free package. Any package you buy will show up here with its reference." />
            
            </div> :

          <ul className="mt-4 divide-y divide-sand">
              {payments.map((payment) => {
              const pkg = db.packages.find((p) => p.id === payment.packageId);
              return (
                <li key={payment.id} className="flex items-center justify-between gap-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-ink">
                        {pkg?.name ?? 'Package'} · {money(payment.amount)}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                        {shortDate(payment.createdAt)} · {payment.method} · {payment.reference}
                      </p>
                    </div>
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
                  </li>);

            })}
            </ul>
          }
        </div>
      </div>
    </Page>);

}