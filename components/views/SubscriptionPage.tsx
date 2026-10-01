'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CreditCardIcon, CoinsIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge, EmptyState } from '@/components/ui/Bits';
import { UsageMeter } from '@/components/UsageMeter';
import { useStore } from '@/lib/contexts/StoreContext';
import { money, shortDate } from '@/lib/utils/format';
import { checkWelcomeBonusAction, claimWelcomeBonusAction, getWingitsTransactionsAction } from '@/app/actions/wingits';
import { toast } from 'sonner';

export function SubscriptionPage() {
  const router = useRouter();
  const { currentUser, entitlements, paymentsOf, db } = useStore();
  const [hasClaimedBonus, setHasClaimedBonus] = React.useState(true);
  const [claiming, setClaiming] = React.useState(false);
  const [transactions, setTransactions] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (currentUser) {
      checkWelcomeBonusAction().then(claimed => setHasClaimedBonus(claimed));
      getWingitsTransactionsAction().then(txs => setTransactions(txs || []));
    }
  }, [currentUser]);

  const handleClaimBonus = async () => {
    setClaiming(true);
    const result = await claimWelcomeBonusAction();
    setClaiming(false);
    if (result.ok) {
      toast.success('You have successfully claimed 20 Free Wingits!');
      setHasClaimedBonus(true);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      toast.error(result.error || 'Failed to claim wingits');
    }
  };

  if (!currentUser || !entitlements) return null;

  const payments = paymentsOf(currentUser.id);

  return (
    <Page>
      <PageHeader
        title="Wingits"
        body="Your package, your remaining allowance, and every payment on your account."
        action={
        <Button onClick={() => router.push('/packages')}>
            Buy Wingits
          </Button>
        } />
      

      <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
        <div className="rounded-4xl bg-cream-deep p-6 shadow-card flex flex-col items-center justify-center lg:col-span-2 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <p className="text-[14px] font-semibold uppercase tracking-[0.08em] text-ink-muted mb-2 relative z-10">
            Current Wingits Balance
          </p>
          <div className="flex items-center gap-3 text-5xl font-display font-bold text-amber-500 relative z-10">
             <CoinsIcon className="h-10 w-10" />
             {currentUser.wingitsBalance} Wingits
          </div>
          {!hasClaimedBonus && (
            <div className="mt-6 relative z-10">
              <Button onClick={handleClaimBonus} loading={claiming} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-6">
                Claim 20 Free Wingits
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-4xl bg-cream-deep p-6 shadow-card">
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
              label="Free Wingles (Sent)"
              used={currentUser.isUnlimited ? 0 : currentUser.freeWinglesSent}
              limit={currentUser.isUnlimited ? null : 5} />
            
            <UsageMeter
              label="Free Wingles (Accepted)"
              used={currentUser.isUnlimited ? 0 : currentUser.freeWinglesAccepted}
              limit={currentUser.isUnlimited ? null : 2} />
          </div>

          <dl className="mt-6 divide-y divide-sand border-t border-sand text-[14px]">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Incoming wingles</dt>
              <dd className="font-medium text-ink">
                {entitlements.incomingWinglesUnlocked ? 'Unlocked' : 'Locked'}
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

        <div className="rounded-4xl bg-cream-deep p-6 shadow-card">
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

      {transactions.length > 0 && (
        <div className="mt-8 max-w-4xl rounded-4xl bg-cream-deep p-6 shadow-card">
          <h2 className="font-display text-xl text-ink">Wingits usage history</h2>
          <ul className="mt-4 divide-y divide-sand">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex-shrink-0 p-2 rounded-full ${tx.amount > 0 ? 'bg-moss/10 text-moss' : 'bg-red-500/10 text-red-500'}`}>
                    <CoinsIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="truncate text-[14px] font-medium text-ink">
                      {tx.description}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                      {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <Badge tone={tx.amount > 0 ? 'moss' : 'red'}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Page>);

}
