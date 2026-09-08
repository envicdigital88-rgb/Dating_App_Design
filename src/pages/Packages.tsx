import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LockIcon, MessageCircleIcon, SendIcon, ShieldCheckIcon } from 'lucide-react';
import { Page, PageHeader } from '../components/AppShell';
import { PackageGrid } from '../components/PackageGrid';
import { useStore } from '../contexts/StoreContext';
import { faqs } from '../data/seed';

export function Packages() {
  const navigate = useNavigate();
  const { db, entitlements } = useStore();
  if (!entitlements) return null;

  return (
    <Page>
      <PageHeader
        title="Packages"
        body="Every package holds an allowance on your account. Limits are set by our team and can change — what you see here is always live." />
      

      <PackageGrid
        packages={db.packages}
        currentPackageId={entitlements.packageId}
        onSelect={(pkg) => {
          if (pkg.price === 0) {
            navigate('/app/discover');
            return;
          }
          navigate(`/app/checkout/${pkg.id}`);
        }}
        ctaLabel="Upgrade to" />
      

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {[
        {
          icon: <MessageCircleIcon className="h-5 w-5" />,
          title: 'Messages are counted, not throttled',
          body: 'Each message you send uses one from your allowance. Receiving is always free, and nothing is ever deleted when you run out.'
        },
        {
          icon: <LockIcon className="h-5 w-5" />,
          title: 'Incoming requests unlock instantly',
          body: 'The moment a payment is verified, every request waiting for you is revealed — including ones sent while you were on Free.'
        },
        {
          icon: <SendIcon className="h-5 w-5" />,
          title: 'Requests reset with each package',
          body: 'Buying or upgrading a package starts a new allowance period for both messages and dating requests.'
        }].
        map((item) =>
        <div key={item.title} className="rounded-4xl bg-white p-6 shadow-card">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-berry-50 text-berry-500">
              {item.icon}
            </span>
            <h2 className="font-display text-lg text-ink">{item.title}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{item.body}</p>
          </div>
        )}
      </div>

      <div className="mt-10 max-w-3xl">
        <h2 className="flex items-center gap-2 font-display text-xl text-ink">
          <ShieldCheckIcon className="h-4 w-4 text-moss" />
          Before you pay
        </h2>
        <dl className="mt-4 divide-y divide-sand rounded-4xl bg-white px-5 shadow-card">
          {faqs.slice(0, 3).map((faq) =>
          <div key={faq.q} className="py-4">
              <dt className="font-medium text-ink">{faq.q}</dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{faq.a}</dd>
            </div>
          )}
        </dl>
      </div>
    </Page>);

}