'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  RefreshCwIcon, 
  SearchIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon
} from 'lucide-react';
import { AdminHeader, StatTile } from './AdminShell';
import { Badge } from '@/components/ui/Bits';
import { relativeTime } from '@/lib/utils/format';
import { getAdminActivityDataAction } from '@/app/actions/admin';
import { WINGLE_SEND_COST, WINGLE_ACCEPT_COST } from '@/lib/wingle-pricing';

interface ActivityData {
  totalWingles: number;
  acceptedWingles: number;
  declinedWingles: number;
  acceptRate: number;
  minglesSent: number;
  blocksCount: number;
  chatReportsCount: number;
  recentWingles: Array<{
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    note: string;
    status: string;
    createdAt: string;
    respondedAt: string | null;
  }>;
  usageRows: Array<{
    id: string;
    name: string;
    email: string;
    lastActiveAt: string;
    pkg: {
      id: string;
      name: string;
    };
    chatUsed: number;
    winglesUsed: number;
    winglesAccepted: number;
    wingitsBalance: number;
    isUnlimited: boolean;
  }>;
}

export function AdminActivity() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usageFilter, setUsageFilter] = useState<'all' | 'active' | 'low_balance'>('all');
  const [wingleFilter, setWingleFilter] = useState<'all' | 'accepted' | 'pending' | 'declined'>('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await getAdminActivityDataAction();
      if (res.ok && res.data) {
        setData(res.data as unknown as ActivityData);
      } else if (res.error) {
        console.error('Failed to load activity data:', res.error);
        if (isManual) toast.error('Failed to refresh activity data');
      }
    } catch (err) {
      console.error('Fetch activity error:', err);
      if (isManual) toast.error('Error fetching activity');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchData();

    // Smart poll every 30 seconds when tab is active
    const interval = setInterval(() => {
      if (mounted && typeof document !== 'undefined' && !document.hidden) {
        fetchData();
      }
    }, 30000);

    const handleVisibility = () => {
      if (!document.hidden && mounted) fetchData();
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

  // Reset pagination when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, usageFilter]);

  const filteredUsageRows = useMemo(() => {
    if (!data) return [];
    return data.usageRows.filter(row => {
      // Search filter
      const matchesSearch = 
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.email.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Status filter
      if (usageFilter === 'low_balance') return !row.isUnlimited && row.wingitsBalance < WINGLE_SEND_COST;
      if (usageFilter === 'active') return row.chatUsed > 0 || row.winglesUsed > 0 || row.winglesAccepted > 0;
      return true;
    });
  }, [data, searchQuery, usageFilter]);

  const totalPages = Math.ceil(filteredUsageRows.length / itemsPerPage) || 1;
  const paginatedUsageRows = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredUsageRows.slice(start, start + itemsPerPage);
  }, [filteredUsageRows, page, itemsPerPage]);

  const filteredWingles = useMemo(() => {
    if (!data) return [];
    if (wingleFilter === 'all') return data.recentWingles;
    return data.recentWingles.filter(w => w.status === wingleFilter);
  }, [data, wingleFilter]);

  const activeMembersCount = useMemo(() => {
    if (!data) return 0;
    return data.usageRows.filter(r => r.chatUsed > 0 || r.winglesUsed > 0 || r.winglesAccepted > 0).length;
  }, [data]);

  const lowBalanceMembersCount = useMemo(() => {
    if (!data) return 0;
    return data.usageRows.filter(r => !r.isUnlimited && r.wingitsBalance < WINGLE_SEND_COST).length;
  }, [data]);

  if (loading && !data) {
    return (
      <div>
        <AdminHeader
          title="Wingles & chat"
          body={`Sending costs ${WINGLE_SEND_COST} Wingits and accepting costs ${WINGLE_ACCEPT_COST} Wingits. Text chat is free once a Wingle is accepted.`} />
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-ink-muted">
          <RefreshCwIcon className="h-6 w-6 animate-spin text-berry-500" />
          <p className="text-sm">Loading activity data...</p>
        </div>
      </div>
    );
  }

  const winglesCount = data?.totalWingles ?? 0;
  const acceptedCount = data?.acceptedWingles ?? 0;
  const minglesSentCount = data?.minglesSent ?? 0;
  const blocksCount = data?.blocksCount ?? 0;
  const chatReportsCount = data?.chatReportsCount ?? 0;
  const acceptRate = data?.acceptRate ?? 0;

  return (
    <div>
      <AdminHeader
        title="Wingles & chat"
        body={`Sending costs ${WINGLE_SEND_COST} Wingits and accepting costs ${WINGLE_ACCEPT_COST} Wingits. Text chat is free once a Wingle is accepted.`}
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-cream-deep px-3 py-1.5 text-xs text-ink-muted">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live sync
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-full bg-cream-deep px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sand/60 disabled:opacity-50"
              title="Refresh live data"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        }
      />

      {/* KPI Stat Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile 
          label="Total wingles" 
          value={winglesCount} 
        />
        <StatTile 
          label="Accepted" 
          value={acceptedCount} 
          hint={`${acceptRate}% accept rate`} 
        />
        <StatTile 
          label="Mingles" 
          value={minglesSentCount} 
          emphasis 
        />
        <StatTile
          label="Blocks"
          value={blocksCount}
          hint={`${chatReportsCount} chat reports`} 
        />
      </div>

      {/* Member activity and Wingits Section */}
      <section className="mt-8 overflow-hidden rounded-4xl bg-cream-deep shadow-card border border-sand/40">
        <div className="border-b border-sand p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-xl text-ink">
              Member activity and Wingits
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Showing {filteredUsageRows.length} member{filteredUsageRows.length === 1 ? '' : 's'} · {activeMembersCount} active users
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member..."
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs rounded-full bg-cream border border-sand text-ink placeholder:text-ink-muted focus:outline-none focus:border-berry-500 transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="inline-flex rounded-full bg-cream p-1 border border-sand/50 text-xs">
              <button
                onClick={() => setUsageFilter('all')}
                className={`px-3 py-1 rounded-full transition-colors ${
                  usageFilter === 'all' ? 'bg-cream-deep text-ink shadow-sm font-medium' : 'text-ink-muted hover:text-ink'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setUsageFilter('active')}
                className={`px-3 py-1 rounded-full transition-colors ${
                  usageFilter === 'active' ? 'bg-cream-deep text-ink shadow-sm font-medium' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Active ({activeMembersCount})
              </button>
              <button
                onClick={() => setUsageFilter('low_balance')}
                className={`px-3 py-1 rounded-full transition-colors ${
                  usageFilter === 'low_balance' ? 'bg-cream-deep text-ink shadow-sm font-medium' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Low balance ({lowBalanceMembersCount})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-sand text-[12px] uppercase tracking-[0.06em] text-ink-muted bg-cream/40">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Member</th>
                <th scope="col" className="px-5 py-3 font-semibold">Package</th>
                <th scope="col" className="px-5 py-3 font-semibold">Messages sent</th>
                <th scope="col" className="hidden px-5 py-3 font-semibold md:table-cell">Wingles sent</th>
                <th scope="col" className="px-5 py-3 font-semibold">Wingles accepted</th>
                <th scope="col" className="px-5 py-3 font-semibold text-right">Wingits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {paginatedUsageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-muted text-sm">
                    No members match your search or filter.
                  </td>
                </tr>
              ) : (
                paginatedUsageRows.map(row => (
                    <tr key={row.id} className="hover:bg-cream/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-berry-500/20 text-berry-400 font-semibold flex items-center justify-center text-xs shrink-0">
                            {row.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-medium text-ink">{row.name}</span>
                            <span className="block text-[12px] text-ink-muted">
                              Active {relativeTime(row.lastActiveAt)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-sand/60 text-ink-soft">
                          {row.pkg.name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft">{row.chatUsed}</td>
                      <td className="hidden px-5 py-3.5 text-ink-soft md:table-cell">{row.winglesUsed}</td>
                      <td className="px-5 py-3.5 text-ink-soft">{row.winglesAccepted}</td>
                      <td className="px-5 py-3.5 text-right text-ink-soft">
                        {row.wingitsBalance}
                        {row.isUnlimited && <span className="ml-2 text-xs text-ink-muted">Unlimited access</span>}
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="border-t border-sand px-5 py-3.5 flex items-center justify-between text-xs text-ink-muted">
            <span>
              Page {page} of {totalPages} ({filteredUsageRows.length} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-sand hover:bg-sand/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous page"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-sand hover:bg-sand/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next page"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Recent wingles Section */}
      <section className="mt-8 overflow-hidden rounded-4xl bg-cream-deep shadow-card border border-sand/40">
        <div className="border-b border-sand p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-ink">
              Recent wingles
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Live wingle connection requests sent across the platform
            </p>
          </div>

          <div className="inline-flex rounded-full bg-cream p-1 border border-sand/50 text-xs">
            <button
              onClick={() => setWingleFilter('all')}
              className={`px-3 py-1 rounded-full transition-colors ${
                wingleFilter === 'all' ? 'bg-cream-deep text-ink shadow-sm font-medium' : 'text-ink-muted hover:text-ink'
              }`}
            >
              All ({data?.recentWingles.length ?? 0})
            </button>
            <button
              onClick={() => setWingleFilter('accepted')}
              className={`px-3 py-1 rounded-full transition-colors ${
                wingleFilter === 'accepted' ? 'bg-cream-deep text-ink shadow-sm font-medium' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Accepted ({data?.recentWingles.filter(w => w.status === 'accepted').length ?? 0})
            </button>
            <button
              onClick={() => setWingleFilter('pending')}
              className={`px-3 py-1 rounded-full transition-colors ${
                wingleFilter === 'pending' ? 'bg-cream-deep text-ink shadow-sm font-medium' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Pending ({data?.recentWingles.filter(w => w.status === 'pending').length ?? 0})
            </button>
            <button
              onClick={() => setWingleFilter('declined')}
              className={`px-3 py-1 rounded-full transition-colors ${
                wingleFilter === 'declined' ? 'bg-cream-deep text-ink shadow-sm font-medium' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Declined ({data?.recentWingles.filter(w => w.status === 'declined').length ?? 0})
            </button>
          </div>
        </div>

        <ul className="divide-y divide-sand">
          {filteredWingles.length === 0 ? (
            <li className="px-5 py-10 text-center text-ink-muted text-sm">
              No recent wingles found in this category.
            </li>
          ) : (
            filteredWingles.map((wingle) => {
              return (
                <li key={wingle.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-cream/20 transition-colors">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-ink flex items-center gap-1.5">
                      <span className="text-berry-400">{wingle.fromUserName}</span>
                      <span className="text-ink-muted text-xs">→</span>
                      <span className="text-berry-400">{wingle.toUserName}</span>
                    </p>
                    <p className="truncate text-[12px] text-ink-muted mt-0.5">
                      {wingle.note ? `"${wingle.note}"` : <span className="italic">No note</span>} · {relativeTime(wingle.createdAt)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      wingle.status === 'accepted'
                        ? 'moss'
                        : wingle.status === 'declined'
                        ? 'red'
                        : 'amber'
                    }
                  >
                    {wingle.status}
                  </Badge>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
