'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  RefreshCwIcon, 
  SearchIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  RotateCcwIcon 
} from 'lucide-react';
import { AdminHeader, StatTile } from './AdminShell';
import { Badge } from '@/components/ui/Bits';
import { relativeTime } from '@/lib/utils/format';
import { getAdminActivityDataAction, resetMemberUsageAction } from '@/app/actions/admin';

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
      chatLimit: number | null;
      wingleLimit: number | null;
    };
    chatUsed: number;
    winglesUsed: number;
  }>;
}

export function AdminActivity() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usageFilter, setUsageFilter] = useState<'all' | 'active' | 'exhausted' | 'within'>('all');
  const [wingleFilter, setWingleFilter] = useState<'all' | 'accepted' | 'pending' | 'declined'>('all');
  const [page, setPage] = useState(1);
  const [resettingId, setResettingId] = useState<string | null>(null);
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

    // Auto-refresh every 8 seconds
    const interval = setInterval(() => {
      if (mounted) {
        fetchData();
      }
    }, 8000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, usageFilter]);

  const handleResetUsage = async (userId: string, userName: string) => {
    setResettingId(userId);
    try {
      const res = await resetMemberUsageAction(userId);
      if (res.ok) {
        toast.success(`Reset usage for ${userName}`);
        // Instantly update local state
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            usageRows: prev.usageRows.map(row => 
              row.id === userId ? { ...row, chatUsed: 0, winglesUsed: 0 } : row
            )
          };
        });
      } else {
        toast.error(res.error || 'Failed to reset usage');
      }
    } catch (err) {
      toast.error('An error occurred while resetting usage');
    } finally {
      setResettingId(null);
    }
  };

  const filteredUsageRows = useMemo(() => {
    if (!data) return [];
    return data.usageRows.filter(row => {
      // Search filter
      const matchesSearch = 
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.email.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Status filter
      const isExhausted = row.pkg.chatLimit !== null && row.chatUsed >= row.pkg.chatLimit;
      if (usageFilter === 'exhausted') return isExhausted;
      if (usageFilter === 'within') return !isExhausted;
      if (usageFilter === 'active') return row.chatUsed > 0 || row.winglesUsed > 0;
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
    return data.usageRows.filter(r => r.chatUsed > 0 || r.winglesUsed > 0).length;
  }, [data]);

  const exhaustedMembersCount = useMemo(() => {
    if (!data) return 0;
    return data.usageRows.filter(r => r.pkg.chatLimit !== null && r.chatUsed >= r.pkg.chatLimit).length;
  }, [data]);

  if (loading && !data) {
    return (
      <div>
        <AdminHeader
          title="Wingles & chat"
          body="Wingle throughput, chat consumption per member, and abuse signals. Usage is metered server-side against each member's package." />
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
        body="Wingle throughput, chat consumption per member, and abuse signals. Usage is metered server-side against each member's package."
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
          label="Mingles sent" 
          value={minglesSentCount} 
          emphasis 
        />
        <StatTile
          label="Blocks"
          value={blocksCount}
          hint={`${chatReportsCount} chat reports`} 
        />
      </div>

      {/* Chat usage by member Section */}
      <section className="mt-8 overflow-hidden rounded-4xl bg-cream-deep shadow-card border border-sand/40">
        <div className="border-b border-sand p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-xl text-ink">
              Chat usage by member
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
                onClick={() => setUsageFilter('exhausted')}
                className={`px-3 py-1 rounded-full transition-colors ${
                  usageFilter === 'exhausted' ? 'bg-cream-deep text-ink shadow-sm font-medium' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Exhausted ({exhaustedMembersCount})
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
                <th scope="col" className="px-5 py-3 font-semibold">Mingles used</th>
                <th scope="col" className="hidden px-5 py-3 font-semibold md:table-cell">Wingles used</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 font-semibold text-right">Actions</th>
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
                paginatedUsageRows.map((row) => {
                  const chatLimit = row.pkg.chatLimit;
                  const exhausted = chatLimit !== null && row.chatUsed >= chatLimit;
                  const chatPercent = chatLimit ? Math.min(100, Math.round((row.chatUsed / chatLimit) * 100)) : 0;
                  const isResetting = resettingId === row.id;

                  return (
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
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <span className="text-ink-soft text-sm font-medium">
                            {row.chatUsed} / {chatLimit === null ? '∞' : chatLimit}
                          </span>
                          {chatLimit !== null && (
                            <div className="w-24 h-1.5 rounded-full bg-sand overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  exhausted ? 'bg-red-500' : 'bg-berry-500'
                                }`}
                                style={{ width: `${chatPercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-5 py-3.5 text-ink-soft md:table-cell">
                        <span className="font-medium">
                          {row.winglesUsed}
                        </span>
                        <span className="text-ink-muted text-xs">
                          {' '}/ {row.pkg.wingleLimit === null ? '∞' : row.pkg.wingleLimit}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={exhausted ? 'red' : 'moss'}>
                          {exhausted ? 'Limit reached' : 'Within limit'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleResetUsage(row.id, row.name)}
                          disabled={isResetting || (row.chatUsed === 0 && row.winglesUsed === 0)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-ink-muted hover:text-ink hover:bg-sand/60 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Reset usage counter"
                        >
                          <RotateCcwIcon className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
                          Reset
                        </button>
                      </td>
                    </tr>
                  );
                })
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
