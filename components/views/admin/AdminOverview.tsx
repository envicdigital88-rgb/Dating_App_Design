'use client';

import React, { useState, useEffect } from 'react';
import { AdminHeader, StatTile } from './AdminShell';
import { Badge } from '@/components/ui/Bits';
import { money, relativeTime } from '@/lib/utils/format';
import { getAdminOverviewStatsAction } from '@/app/actions/admin';

interface AdminStats {
  totalMembers: number;
  womenCount: number;
  menCount: number;
  nonBinaryCount: number;
  newThisMonth: number;
  activeToday: number;
  revenue: number;
  succeededCount: number;
  activeSubs: number;
  totalWingles: number;
  acceptedWingles: number;
  minglesCount: number;
  connectionsCount: number;
  openReports: number;
  totalReports: number;
  popular: {
    pkg: any;
    count: number;
  }[];
  latestWingles: {
    id: string;
    createdAt: string | Date;
    status: string;
    fromUserName: string;
    toUserName: string;
  }[];
}
export function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      const res = await getAdminOverviewStatsAction();
      if (res.ok && res.data && mounted) {
        const d = res.data;

        const acceptedWingles = d.wingles.filter((w: any) => w.status === 'accepted').length;
        const succeeded = d.payments.filter((p: any) => p.status === 'succeeded');
        const revenue = succeeded.reduce((t: number, p: any) => t + p.amount, 0);
        const activeSubs = d.subscriptions.filter(
          (s: any) => s.status === 'active' && new Date(s.expiresAt) > new Date()
        ).length;

        const popular = d.packages.map((pkg: any) => ({
          pkg,
          count: succeeded.filter((p: any) => p.packageId === pkg.id).length
        })).sort((a: any, b: any) => b.count - a.count);

        setStats({
          totalMembers: d.totalMembers,
          womenCount: d.womenCount,
          menCount: d.menCount,
          nonBinaryCount: d.nonBinaryCount,
          newThisMonth: d.newThisMonth,
          activeToday: d.activeToday,
          revenue,
          succeededCount: succeeded.length,
          activeSubs,
          totalWingles: d.wingles.length,
          acceptedWingles,
          minglesCount: d.minglesCount,
          connectionsCount: d.connectionsCount,
          openReports: d.reports.filter((r: any) => r.status === 'open').length,
          totalReports: d.reports.length,
          popular,
          latestWingles: d.latestActivity
        });
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!stats) {
    return (
      <div>
        <AdminHeader
          title="Overview"
          body="Live platform activity. Real-time updates active." />
        <div className="flex h-64 items-center justify-center text-[14px] text-ink-soft">
          Loading live data...
        </div>
      </div>
    );
  }

  const maxCount = Math.max(1, ...stats.popular.map((p: any) => p.count));

  return (
    <div>
      <AdminHeader
        title="Overview"
        body="Live platform activity. Real-time updates active." />
      

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total members" value={stats.totalMembers} hint={`${stats.womenCount} women · ${stats.menCount} men${stats.nonBinaryCount > 0 ? ` · ${stats.nonBinaryCount} NB` : ''}`} />
        <StatTile label="Active in last 24h" value={stats.activeToday} />
        <StatTile
          label="Revenue"
          value={money(stats.revenue)}
          hint={`${stats.succeededCount} successful payments`}
          emphasis />
        
        <StatTile label="Active subscriptions" value={stats.activeSubs} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Wingling wingles"
          value={stats.totalWingles}
          hint={`${stats.acceptedWingles} accepted`} />
        
        <StatTile label="Mingles sent" value={stats.minglesCount} />
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
            {stats.popular.map(({ pkg, count }: any) =>
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
                  style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }} />
                
                </div>
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-4xl bg-cream-deep p-6 shadow-card">
          <h2 className="font-display text-xl text-ink">Latest activity</h2>
          <ul className="mt-4 divide-y divide-sand">
            {stats.latestWingles.map((wingle: any) => {
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
