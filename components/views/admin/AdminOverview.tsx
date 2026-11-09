'use client';

import React, { useState, useEffect } from 'react';
import { AdminHeader, StatTile } from './AdminShell';
import { Badge } from '@/components/ui/Bits';
import { RefreshCwIcon } from 'lucide-react';
import { money, relativeTime } from '@/lib/utils/format';
import { getAdminOverviewStatsAction } from '@/app/actions/admin';

type AdminStats = NonNullable<Awaited<ReturnType<typeof getAdminOverviewStatsAction>>['data']>;

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await getAdminOverviewStatsAction();
      if (!res.ok || !res.data) throw new Error(res.error || 'Dashboard data unavailable');
      setStats(res.data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    fetchStats();
    const interval = setInterval(() => {
      if (mounted && typeof document !== 'undefined' && !document.hidden) {
        fetchStats();
      }
    }, 25000);

    const handleVisibility = () => {
      if (!document.hidden && mounted) fetchStats();
    };
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (!stats) {
    return (
      <div>
        <AdminHeader
          title="Overview"
          body="Platform activity and payments." />
        <div role="status" className="flex h-64 flex-col items-center justify-center gap-2 text-[14px] text-ink-soft">
          {loadError && !refreshing ? (
            <>
              <p>Dashboard data is unavailable.</p>
              <button type="button" className="text-berry-500 underline" onClick={() => fetchStats(true)}>Try again</button>
            </>
          ) : 'Loading dashboard data...'}
        </div>
      </div>
    );
  }

  const maxCount = Math.max(1, ...stats.popular.map(p => p.count));

  return (
    <div>
      <AdminHeader
        title="Overview"
        body="Platform activity and payments."
        action={
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-full border border-sand bg-cream-deep px-3.5 py-1.5 text-[12px] font-medium text-ink hover:border-sand-deep transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Refresh dashboard stats"
          >
            <RefreshCwIcon className={`h-3.5 w-3.5 text-ink-muted ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        } />
      {loadError && <p role="status" className="mb-4 text-sm text-amber-500">Refresh failed. Showing the last successful update.</p>}
      

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total members" value={stats.totalMembers} hint={`${stats.womenCount} women · ${stats.menCount} men${stats.nonBinaryCount > 0 ? ` · ${stats.nonBinaryCount} NB` : ''}`} />
        <StatTile label="Members seen in last 24h" value={stats.activeToday} hint="Recorded signup or app activity" />
        <StatTile
          label="Revenue"
          value={money(stats.revenue)}
          hint={`${stats.succeededCount} successful payments`}
          emphasis />
        
        <StatTile label="Active subscriptions" value={stats.activeSubs}
          hint={`${stats.unlimitedUsersCount} ${stats.unlimitedUsersCount === 1 ? 'member' : 'members'} with Unlimited access`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Wingles"
          value={stats.totalWingles}
          hint={`${stats.acceptedWingles} accepted`} />
        
        <StatTile label="Mingles" value={stats.minglesCount} />
        <StatTile label="Connections" value={stats.connectionsCount} />
        <StatTile
          label="Open reports"
          value={stats.openReports}
          hint={`${stats.totalReports} total`} />
        
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-4xl bg-cream-deep p-6 shadow-card">
          <h2 className="font-display text-xl text-ink">Package performance</h2>
          <ul className="mt-5 space-y-4">
            {stats.popular.map(({ pkg, count, revenue }) =>
            <li key={pkg.id}>
                <div className="flex items-baseline justify-between gap-4 text-[14px]">
                  <span className="font-medium text-ink">{pkg.name}</span>
                  <span className="text-ink-muted">
                    {count} sold · {money(revenue)}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-deep">
                  <div
                  className="h-full rounded-full bg-berry-500 transition-[width] duration-300 ease-soft"
                  style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }} />
                
                </div>
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-4xl bg-cream-deep p-6 shadow-card">
          <h2 className="font-display text-xl text-ink">Latest Wingles</h2>
          <ul className="mt-4 divide-y divide-sand">
            {stats.latestActivity.map(wingle => {
              return (
                <li key={wingle.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] text-ink">
                        {wingle.fromUserName} → {wingle.toUserName}
                      </p>
                      <p className="text-[12px] text-ink-muted">
                        Wingle · {relativeTime(wingle.createdAt)}
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
      </div>
    </div>);

}
