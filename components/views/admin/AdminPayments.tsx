'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  RefreshCwIcon, 
  SearchIcon, 
  CopyIcon, 
  CheckIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  SparklesIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminHeader, StatTile } from './AdminShell';
import { Button } from '@/components/ui/Button';
import { Badge, Skeleton } from '@/components/ui/Bits';
import { money, shortDate } from '@/lib/utils/format';
import { 
  getAdminPaymentsAction, 
  refundAdminPaymentAction, 
  setUserUnlimitedAction 
} from '@/app/actions/admin';

interface PaymentItem {
  id: string;
  source: 'ledger' | 'payment';
  reference: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  packageName: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  rawStatus: string;
  method: string;
  createdAt: string;
  metadata?: any;
}

interface SubscriptionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  packageName: string;
  startedAt: string;
  expiresAt: string | null;
  status: 'active' | 'expired' | 'cancelled';
  isUnlimited: boolean;
}

interface AdminPaymentsPayload {
  stats: {
    revenue: number;
    succeededCount: number;
    failedCount: number;
    pendingCount: number;
    refundedCount: number;
    refundedAmount: number;
    activeSubscriptionsCount: number;
    expiredSubscriptionsCount: number;
  };
  payments: PaymentItem[];
  subscriptions: SubscriptionItem[];
}

export function AdminPayments() {
  const [data, setData] = useState<AdminPaymentsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'succeeded' | 'pending' | 'failed' | 'refunded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [subPage, setSubPage] = useState(1);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const itemsPerPage = 15;
  const subsPerPage = 10;

  const fetchPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getAdminPaymentsAction();
      if (res.ok && res.data) {
        setData(res.data);
      } else {
        toast.error(res.error || 'Failed to load payments data');
      }
    } catch (err) {
      console.error('Failed to load admin payments:', err);
      toast.error('An unexpected error occurred while loading payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const copyReference = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Reference copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefund = async (paymentId: string) => {
    if (!confirm('Are you sure you want to mark this payment as refunded?')) return;

    setRefundingId(paymentId);
    try {
      const res = await refundAdminPaymentAction(paymentId);
      if (res.ok) {
        toast.success(res.message || 'Payment marked as refunded');
        fetchPayments(true);
      } else {
        toast.error(res.error || 'Failed to refund payment');
      }
    } catch (err) {
      console.error('Refund error:', err);
      toast.error('Failed to process refund');
    } finally {
      setRefundingId(null);
    }
  };

  const handleToggleUnlimited = async (userId: string, currentUnlimited: boolean) => {
    if (currentUnlimited && !confirm('Are you sure you want to revoke VIP unlimited access for this user?')) {
      return;
    }

    setRevokingId(userId);
    try {
      const res = await setUserUnlimitedAction(userId, !currentUnlimited);
      if (res.ok) {
        toast.success(currentUnlimited ? 'VIP unlimited access revoked' : 'VIP unlimited access granted');
        fetchPayments(true);
      } else {
        toast.error(res.error || 'Failed to update user VIP status');
      }
    } catch (err) {
      console.error('VIP toggle error:', err);
      toast.error('Failed to update VIP status');
    } finally {
      setRevokingId(null);
    }
  };

  // Filter and search payments
  const filteredPayments = useMemo(() => {
    if (!data?.payments) return [];
    return data.payments.filter((p) => {
      // Status filter
      if (filter !== 'all' && p.status !== filter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = p.reference.toLowerCase().includes(q);
        const matchesName = p.userName.toLowerCase().includes(q);
        const matchesEmail = p.userEmail.toLowerCase().includes(q);
        const matchesPhone = p.userPhone?.toLowerCase().includes(q) ?? false;
        const matchesPkg = p.packageName.toLowerCase().includes(q);
        if (!matchesRef && !matchesName && !matchesEmail && !matchesPhone && !matchesPkg) {
          return false;
        }
      }

      return true;
    });
  }, [data?.payments, filter, searchQuery]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, page, itemsPerPage]);

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);

  // Filter subscriptions
  const filteredSubs = useMemo(() => {
    if (!data?.subscriptions) return [];
    if (!subSearchQuery.trim()) return data.subscriptions;
    const q = subSearchQuery.toLowerCase().trim();
    return data.subscriptions.filter(
      (s) =>
        s.userName.toLowerCase().includes(q) ||
        s.userEmail.toLowerCase().includes(q) ||
        (s.userPhone && s.userPhone.toLowerCase().includes(q)) ||
        s.packageName.toLowerCase().includes(q)
    );
  }, [data?.subscriptions, subSearchQuery]);

  const totalSubPages = Math.ceil(filteredSubs.length / subsPerPage) || 1;
  const paginatedSubs = useMemo(() => {
    const start = (subPage - 1) * subsPerPage;
    return filteredSubs.slice(start, start + subsPerPage);
  }, [filteredSubs, subPage, subsPerPage]);

  useEffect(() => {
    setSubPage(1);
  }, [subSearchQuery]);

  const counts = useMemo(() => {
    if (!data?.payments) return { all: 0, succeeded: 0, pending: 0, failed: 0, refunded: 0 };
    return {
      all: data.payments.length,
      succeeded: data.payments.filter((p) => p.status === 'succeeded').length,
      pending: data.payments.filter((p) => p.status === 'pending').length,
      failed: data.payments.filter((p) => p.status === 'failed').length,
      refunded: data.payments.filter((p) => p.status === 'refunded').length,
    };
  }, [data?.payments]);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Payments & subscriptions"
        body="Every charge is verified server-side before a package is activated. Refunds revoke nothing retroactively — end the subscription separately if needed."
        action={
          <button
            onClick={() => fetchPayments(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-full border border-sand bg-cream-deep px-4 py-2 text-[13px] font-medium text-ink transition hover:border-sand-deep disabled:opacity-50"
          >
            <RefreshCwIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Metric Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !data ? (
          <>
            <Skeleton className="h-28 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
          </>
        ) : (
          <>
            <StatTile
              label="Revenue"
              value={money(data.stats.revenue)}
              hint={`${data.stats.succeededCount} verified payments`}
              emphasis
            />
            <StatTile
              label="Failed payments"
              value={data.stats.failedCount}
              hint={`${data.stats.pendingCount} pending checkout`}
            />
            <StatTile
              label="Refunds"
              value={data.stats.refundedCount}
              hint={data.stats.refundedAmount > 0 ? money(data.stats.refundedAmount) : 'Rs. 0'}
            />
            <StatTile
              label="Subscriptions"
              value={data.stats.activeSubscriptionsCount}
              hint={`${data.stats.expiredSubscriptionsCount} expired or cancelled`}
            />
          </>
        )}
      </div>

      {/* Payments Section */}
      <section className="overflow-hidden rounded-4xl bg-cream-deep shadow-card">
        <div className="border-b border-sand px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 rounded-full bg-cream p-1 border border-sand/50 text-[13px]">
              {(['all', 'succeeded', 'pending', 'failed', 'refunded'] as const).map((key) => {
                const count = counts[key];
                const isActive = filter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`rounded-full px-3.5 py-1.5 capitalize transition-all duration-150 ${
                      isActive
                        ? 'bg-cream-deep text-ink font-semibold shadow-sm'
                        : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    {key} <span className="ml-1 text-[11px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, member, package..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-full bg-cream border border-sand text-ink placeholder:text-ink-muted focus:outline-none focus:border-berry-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead className="border-b border-sand bg-cream/40 text-[12px] uppercase tracking-[0.06em] text-ink-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Reference</th>
                <th scope="col" className="px-5 py-3 font-semibold">Member</th>
                <th scope="col" className="px-5 py-3 font-semibold">Package / Item</th>
                <th scope="col" className="px-5 py-3 font-semibold">Amount</th>
                <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-6 w-full animate-pulse rounded bg-cream/60" />
                    </td>
                  </tr>
                ))
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[14px] text-ink-muted">
                    No payments found matching the selected filter or search query.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment) => {
                  return (
                    <tr key={payment.id} className="hover:bg-cream/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[13px] text-ink">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[150px]" title={payment.reference}>
                            {payment.reference}
                          </span>
                          <button
                            onClick={() => copyReference(payment.reference, payment.id)}
                            title="Copy full reference"
                            className="text-ink-muted hover:text-ink transition-colors p-0.5"
                          >
                            {copiedId === payment.id ? (
                              <CheckIcon className="h-3.5 w-3.5 text-moss" />
                            ) : (
                              <CopyIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="block font-medium text-ink">{payment.userName}</span>
                        <span className="block text-[12px] text-ink-muted">
                          {payment.userEmail || payment.userPhone || payment.method}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft">
                        <div className="flex items-center gap-1.5">
                          <span>{payment.packageName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-ink">
                        {money(payment.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-ink-soft">
                        {shortDate(payment.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          tone={
                            payment.status === 'succeeded'
                              ? 'moss'
                              : payment.status === 'failed'
                              ? 'red'
                              : payment.status === 'pending'
                              ? 'amber'
                              : 'neutral'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {payment.status === 'succeeded' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={refundingId === payment.id}
                            onClick={() => handleRefund(payment.id)}
                          >
                            {refundingId === payment.id ? 'Refunding...' : 'Refund'}
                          </Button>
                        ) : payment.status === 'refunded' ? (
                          <span className="text-[12px] text-ink-muted">Refunded</span>
                        ) : (
                          <span className="text-[12px] text-ink-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPayments.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-sand px-5 py-3 text-xs text-ink-muted">
            <div>
              Showing <span className="font-medium text-ink">{(page - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium text-ink">
                {Math.min(page * itemsPerPage, filteredPayments.length)}
              </span>{' '}
              of <span className="font-medium text-ink">{filteredPayments.length}</span> transactions
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1 rounded-md hover:bg-cream disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Previous page"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="px-2 font-medium text-ink">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1 rounded-md hover:bg-cream disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Next page"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Subscriptions Section */}
      <section className="overflow-hidden rounded-4xl bg-cream-deep shadow-card">
        <div className="flex flex-col gap-3 border-b border-sand px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl text-ink">Subscriptions</h2>
              {data && (
                <Badge tone="moss" className="text-[10px]">
                  {data.stats.activeSubscriptionsCount} Active
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Active VIP unlimited subscribers and ongoing membership packages.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              value={subSearchQuery}
              onChange={(e) => setSubSearchQuery(e.target.value)}
              placeholder="Search subscribers..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-full bg-cream border border-sand text-ink placeholder:text-ink-muted focus:outline-none focus:border-berry-500 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
        ) : filteredSubs.length === 0 ? (
          <p className="px-5 py-8 text-[14px] text-ink-muted text-center">
            No subscriptions or VIP members found.
          </p>
        ) : (
          <ul className="divide-y divide-sand">
            {paginatedSubs.map((sub) => {
              const live = sub.status === 'active';
              return (
                <li
                  key={sub.id}
                  className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-cream/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14px] font-medium text-ink">
                        {sub.userName}
                      </p>
                      {sub.isUnlimited && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-plum-500/10 px-2 py-0.5 text-[10px] font-semibold text-plum-500">
                          <SparklesIcon className="h-3 w-3" /> VIP Unlimited
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-ink-muted">
                      {sub.userEmail} {sub.userPhone ? `· ${sub.userPhone}` : ''} ·{' '}
                      {sub.expiresAt ? (
                        <>
                          {shortDate(sub.startedAt)} → {shortDate(sub.expiresAt)}
                        </>
                      ) : (
                        `Member since ${shortDate(sub.startedAt)} (Lifetime)`
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={live ? 'moss' : 'neutral'}>
                      {live ? 'Active' : sub.status}
                    </Badge>
                    {sub.isUnlimited && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={revokingId === sub.userId}
                        onClick={() => handleToggleUnlimited(sub.userId, true)}
                        className="text-[11px] text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        {revokingId === sub.userId ? 'Revoking...' : 'Revoke VIP'}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Subscriptions Pagination Footer */}
        {filteredSubs.length > subsPerPage && (
          <div className="flex items-center justify-between border-t border-sand px-5 py-3 text-xs text-ink-muted">
            <div>
              Showing <span className="font-medium text-ink">{(subPage - 1) * subsPerPage + 1}</span> to{' '}
              <span className="font-medium text-ink">
                {Math.min(subPage * subsPerPage, filteredSubs.length)}
              </span>{' '}
              of <span className="font-medium text-ink">{filteredSubs.length}</span> subscribers
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSubPage((p) => Math.max(p - 1, 1))}
                disabled={subPage === 1}
                className="p-1 rounded-md hover:bg-cream disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Previous page"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="px-2 font-medium text-ink">
                Page {subPage} of {totalSubPages}
              </span>
              <button
                onClick={() => setSubPage((p) => Math.min(p + 1, totalSubPages))}
                disabled={subPage === totalSubPages}
                className="p-1 rounded-md hover:bg-cream disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Next page"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
