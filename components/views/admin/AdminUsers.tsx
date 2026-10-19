'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  CheckCircle2Icon, 
  SearchIcon, 
  Trash2Icon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  InfinityIcon,
  ArrowUpDownIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ShieldCheckIcon,
  Loader2Icon
} from 'lucide-react';
import { AdminHeader } from './AdminShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Avatar, Badge } from '@/components/ui/Bits';
import { relativeTime, shortDate } from '@/lib/utils/format';
import { getAdminUsersAction, deleteUserAction, setUserSuspendedAction, setUserVerifiedAction, setUserUnlimitedAction } from '@/app/actions/admin';
import type { User, Photo } from '@/lib/types';

type AdminUser = User & { photos: Photo[] };

function formatGender(gender?: string) {
  if (!gender) return '—';
  const g = gender.trim().toLowerCase();
  if (g === 'woman') return 'Woman';
  if (g === 'man') return 'Man';
  if (g === 'non-binary') return 'Non-binary';
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

export function AdminUsers() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'suspended' | 'unlimited' | 'non-unlimited'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'active' | 'oldest' | 'name'>('newest');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [busyIds, setBusyIds] = useState<Record<string, 'unlimited' | 'verify' | 'suspend' | null>>({});
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [suspendingUser, setSuspendingUser] = useState<AdminUser | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  // Track recent local overrides with a timestamp to avoid background polling reverts
  const recentOverridesRef = useRef<Map<string, { isUnlimited?: boolean; verified?: boolean; suspended?: boolean; suspensionReason?: string | null; timestamp: number }>>(new Map());

  useEffect(() => {
    setPage(1);
  }, [query, filter, sortBy, itemsPerPage]);

  const [realUsers, setRealUsers] = useState<AdminUser[] | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      const res = await getAdminUsersAction();
      if (res.ok && res.data && mounted) {
        const now = Date.now();
        // Clean up overrides older than 30 seconds
        for (const [id, override] of recentOverridesRef.current.entries()) {
          if (now - override.timestamp > 30000) {
            recentOverridesRef.current.delete(id);
          }
        }

        const incoming = res.data as unknown as AdminUser[];
        const merged = incoming.map((u) => {
          const override = recentOverridesRef.current.get(u.id);
          if (override) {
            return {
              ...u,
              ...(override.isUnlimited !== undefined ? { isUnlimited: override.isUnlimited } : {}),
              ...(override.verified !== undefined ? { verified: override.verified } : {}),
              ...(override.suspended !== undefined ? { suspended: override.suspended } : {}),
            };
          }
          return u;
        });

        setRealUsers(merged);
      }
    };
    fetchUsers();
    
    // Poll every 10 seconds to keep the list fresh
    const interval = setInterval(fetchUsers, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const users = (realUsers || []).
  filter((u) =>
    `${u.name} ${u.email} ${u.location}`.toLowerCase().includes(query.trim().toLowerCase())
  ).
  filter((u) => {
    if (filter === 'all') return true;
    if (filter === 'verified') return u.verified;
    if (filter === 'unverified') return !u.verified;
    if (filter === 'suspended') return u.suspended;
    if (filter === 'unlimited') return Boolean(u.isUnlimited);
    if (filter === 'non-unlimited') return !u.isUnlimited;
    return true;
  }).
  sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'active') {
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = users.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleToggleUnlimited = async (user: AdminUser) => {
    if (busyIds[user.id]) return;
    const targetUnlimited = !user.isUnlimited;

    setBusyIds(prev => ({ ...prev, [user.id]: 'unlimited' }));
    recentOverridesRef.current.set(user.id, {
      ...(recentOverridesRef.current.get(user.id) || {}),
      isUnlimited: targetUnlimited,
      timestamp: Date.now()
    });

    setRealUsers(prev => prev ? prev.map(u => u.id === user.id ? { ...u, isUnlimited: targetUnlimited } : u) : null);

    try {
      const apiRes = await fetch('/api/admin/users/unlimited', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isUnlimited: targetUnlimited })
      }).then(r => r.json()).catch(() => null);

      let success = apiRes?.ok;
      if (!success) {
        const actionRes = await setUserUnlimitedAction(user.id, targetUnlimited);
        success = actionRes?.ok;
      }

      if (!success) {
        recentOverridesRef.current.delete(user.id);
        setRealUsers(prev => prev ? prev.map(u => u.id === user.id ? { ...u, isUnlimited: user.isUnlimited } : u) : null);
        toast.error('Failed to update unlimited status');
      } else {
        toast.success(targetUnlimited ? 'Unlimited granted' : 'Unlimited removed');
      }
    } catch (err: any) {
      recentOverridesRef.current.delete(user.id);
      setRealUsers(prev => prev ? prev.map(u => u.id === user.id ? { ...u, isUnlimited: user.isUnlimited } : u) : null);
      toast.error(err?.message || 'Failed to update unlimited status');
    } finally {
      setBusyIds(prev => ({ ...prev, [user.id]: null }));
    }
  };

  const handleToggleVerified = async (user: AdminUser) => {
    if (busyIds[user.id]) return;
    const targetVerified = !user.verified;

    setBusyIds(prev => ({ ...prev, [user.id]: 'verify' }));
    recentOverridesRef.current.set(user.id, {
      ...(recentOverridesRef.current.get(user.id) || {}),
      verified: targetVerified,
      timestamp: Date.now()
    });

    setRealUsers(prev => prev ? prev.map(u => u.id === user.id ? { ...u, verified: targetVerified } : u) : null);

    try {
      const res = await setUserVerifiedAction(user.id, targetVerified);
      if (!res.ok) {
        recentOverridesRef.current.delete(user.id);
        setRealUsers(prev => prev ? prev.map(u => u.id === user.id ? { ...u, verified: user.verified } : u) : null);
        toast.error('Failed to update verification');
      } else {
        toast.success(targetVerified ? 'Member verified' : 'Verification removed');
      }
    } catch (err) {
      recentOverridesRef.current.delete(user.id);
      setRealUsers(prev => prev ? prev.map(u => u.id === user.id ? { ...u, verified: user.verified } : u) : null);
      toast.error('Failed to update verification');
    } finally {
      setBusyIds(prev => ({ ...prev, [user.id]: null }));
    }
  };

  const handleToggleSuspended = (user: AdminUser) => {
    if (busyIds[user.id]) return;
    if (!user.suspended) {
      setSuspendingUser(user);
      setSuspensionReason('');
      return;
    }
    executeSuspendUser(user, false);
  };

  const executeSuspendUser = async (user: AdminUser, targetSuspended: boolean, reason?: string) => {
    setBusyIds(prev => ({ ...prev, [user.id]: 'suspend' }));
    recentOverridesRef.current.set(user.id, {
      ...(recentOverridesRef.current.get(user.id) || {}),
      suspended: targetSuspended,
      suspensionReason: targetSuspended ? reason : null,
      timestamp: Date.now()
    });

    setRealUsers(prev => prev ? prev.map(u => u.id === user.id ? { ...u, suspended: targetSuspended, suspensionReason: targetSuspended ? reason : null } : u) : null);

    try {
      const res = await setUserSuspendedAction(user.id, targetSuspended, reason);
      if (!res.ok) {
        recentOverridesRef.current.delete(user.id);
        setRealUsers(prev => prev ? prev.map(u => u.id === user.id ? { ...u, suspended: user.suspended, suspensionReason: user.suspensionReason } : u) : null);
        toast.error('Failed to update suspension');
      } else {
        toast.success(targetSuspended ? `Member suspended${reason ? `: ${reason}` : ''}` : 'Member reinstated');
      }
    } catch (err) {
      recentOverridesRef.current.delete(user.id);
      setRealUsers(prev => prev ? prev.map(u => u.id === user.id ? { ...u, suspended: user.suspended, suspensionReason: user.suspensionReason } : u) : null);
      toast.error('Failed to update suspension');
    } finally {
      setBusyIds(prev => ({ ...prev, [user.id]: null }));
    }
  };

  const detailUser = (realUsers || []).find((u) => u.id === detail);

  if (!realUsers) {
    return (
      <div>
        <AdminHeader
          title="User management"
          body="Search, review, verify and suspend members. Suspended members cannot sign in and are hidden from Discover." />
        <div className="flex h-64 items-center justify-center text-[14px] text-ink-soft">
          Loading live members...
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="User management"
        body="Search, review, verify and suspend members. Suspended members cannot sign in and are hidden from Discover."
        action={
          <Link
            href="/admin/admins"
            className="inline-flex items-center gap-2 rounded-full bg-cream-deep px-4 py-2 text-xs font-semibold text-ink border border-sand hover:bg-sand/60 transition-colors"
          >
            <ShieldCheckIcon className="h-4 w-4 text-berry-400" />
            Manage Admins
          </Link>
        }
      />
      

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative min-w-[220px] flex-1 max-w-md">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or area"
              className="pl-11"
              aria-label="Search users" />
          </div>

          <div className="inline-flex flex-wrap rounded-full bg-cream-deep p-1 border border-sand/40">
            {([
              { key: 'all', label: 'All' },
              { key: 'verified', label: 'Verified' },
              { key: 'unverified', label: 'Unverified' },
              { key: 'suspended', label: 'Suspended' },
              { key: 'unlimited', label: 'Unlimited' },
              { key: 'non-unlimited', label: 'Non-Unlimited' },
            ] as const).map(({ key, label }) =>
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-150 ease-soft ${
                  filter === key ? 'bg-sand text-ink shadow-sm font-medium' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {label}
              </button>
            )}
          </div>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 bg-cream-deep rounded-full px-3.5 py-1.5 border border-sand/40">
          <ArrowUpDownIcon className="h-3.5 w-3.5 text-berry-400" />
          <span className="text-[12px] text-ink-muted font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-[13px] text-ink font-medium focus:outline-none cursor-pointer pr-1"
          >
            <option value="newest" className="bg-cream-deep text-ink">Newest first</option>
            <option value="active" className="bg-cream-deep text-ink">Recently active</option>
            <option value="oldest" className="bg-cream-deep text-ink">Oldest first</option>
            <option value="name" className="bg-cream-deep text-ink">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-4xl bg-cream-deep shadow-card border border-sand/40">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-sand text-[12px] uppercase tracking-[0.06em] text-ink-muted bg-cream/40">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Member</th>
              <th 
                scope="col" 
                onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                className="hidden px-5 py-3 font-semibold md:table-cell cursor-pointer hover:text-ink transition-colors select-none"
                title="Click to sort by Joined date"
              >
                <div className="flex items-center gap-1.5">
                  Joined
                  {sortBy === 'newest' && <ArrowDownIcon className="h-3.5 w-3.5 text-berry-400" />}
                  {sortBy === 'oldest' && <ArrowUpIcon className="h-3.5 w-3.5 text-berry-400" />}
                </div>
              </th>
              <th 
                scope="col" 
                onClick={() => setSortBy(sortBy === 'active' ? 'newest' : 'active')}
                className="hidden px-5 py-3 font-semibold lg:table-cell cursor-pointer hover:text-ink transition-colors select-none"
                title="Click to sort by Last active"
              >
                <div className="flex items-center gap-1.5">
                  Last active
                  {sortBy === 'active' && <ArrowDownIcon className="h-3.5 w-3.5 text-berry-400" />}
                </div>
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {paginatedUsers.map((user) =>
            <tr key={user.id} className="align-middle">
                <td className="px-5 py-3.5">
                  <button
                  onClick={() => setDetail(user.id)}
                  className="flex items-center gap-3 text-left">
                  
                    <Avatar src={user.photos?.[0]?.url} name={user.name} size={38} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {user.name}, {user.age}
                        {user.gender && (
                          <span className="ml-1.5 text-[12px] font-normal text-ink-muted capitalize">
                            · {user.gender}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-[12px] text-ink-muted">{user.email}</span>
                    </span>
                  </button>
                </td>
                <td className="hidden px-5 py-3.5 text-ink-soft md:table-cell">
                  {shortDate(user.createdAt)}
                </td>
                <td className="hidden px-5 py-3.5 text-ink-soft lg:table-cell">
                  {relativeTime(user.lastActiveAt)}
                </td>
                <td className="px-5 py-3.5">
                  {user.suspended ? (
                    <div>
                      <Badge tone="red">Suspended</Badge>
                      {user.suspensionReason && (
                        <div className="text-[11px] text-berry-600 mt-1 max-w-[200px] truncate font-medium" title={user.suspensionReason}>
                          Reason: {user.suspensionReason}
                        </div>
                      )}
                    </div>
                  ) : user.verified ? (
                    <Badge tone="moss">Verified</Badge>
                  ) : (
                    <Badge tone="amber">Unverified</Badge>
                  )}
                  {user.isUnlimited && (
                    <Badge tone="indigo" className="ml-2">Unlimited</Badge>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={Boolean(busyIds[user.id])}
                      onClick={() => handleToggleVerified(user)}
                    >
                      {busyIds[user.id] === 'verify' ? (
                        <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2Icon className="h-3.5 w-3.5" />
                      )}
                      {user.verified ? 'Unverify' : 'Verify'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={Boolean(busyIds[user.id])}
                      onClick={() => handleToggleUnlimited(user)}
                    >
                      {busyIds[user.id] === 'unlimited' ? (
                        <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <InfinityIcon className="h-3.5 w-3.5" />
                      )}
                      {user.isUnlimited ? 'Remove Unltd' : 'Make Unltd'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={Boolean(busyIds[user.id])}
                      onClick={() => handleToggleSuspended(user)}
                    >
                      {busyIds[user.id] === 'suspend' ? (
                        <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      {user.suspended ? 'Reinstate' : 'Suspend'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      aria-label={`Delete ${user.name}`}
                      disabled={Boolean(busyIds[user.id])}
                      onClick={() => setPendingDelete(user.id)}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {users.length === 0 &&
        <p className="px-5 py-10 text-center text-[14px] text-ink-muted">
            No members match that search.
          </p>
        }
        {users.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand px-5 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-[13px] text-ink-muted">
                Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, users.length)} of {users.length}
              </p>
              <div className="flex items-center gap-2 text-[13px] text-ink-muted">
                <span>Per page:</span>
                <div className="inline-flex rounded-lg bg-cream-deep p-0.5 border border-sand/40">
                  {[50, 100, 1000].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setItemsPerPage(size)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                        itemsPerPage === size
                          ? 'bg-ink text-cream shadow-sm'
                          : 'text-ink-soft hover:text-ink hover:bg-sand/40'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-muted hidden sm:inline">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeftIcon className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={!!detailUser}
        onClose={() => setDetail(null)}
        title={detailUser ? `${detailUser.name}, ${detailUser.age}${detailUser.gender ? ` (${formatGender(detailUser.gender)})` : ''}` : ''}
        description={detailUser?.email}
        size="md">
        
        {detailUser &&
        <div className="space-y-4">
            <ul className="flex gap-2">
              {(detailUser.photos || []).map((photo) =>
            <li key={photo.id}>
                  <img src={photo.url} alt="" className="h-24 w-20 rounded-2xl object-cover" />
                </li>
            )}
            </ul>
            <p className="text-[14px] leading-relaxed text-ink-soft">{detailUser.bio}</p>
            <dl className="divide-y divide-sand border-y border-sand text-[13px]">
              {[
                ['Gender', formatGender(detailUser.gender)],
                ['Location', detailUser.location || '—'],
                ['Intention', detailUser.intention || '—'],
                ['Unlimited access', detailUser.isUnlimited ? 'Active (Unlimited)' : 'No (Standard)'],
                ['Wingits balance', detailUser.wingitsBalance?.toString() || '0'],
                ['Verification', detailUser.verified ? 'Verified' : 'Unverified'],
                ['Account state', detailUser.suspended ? 'Suspended' : 'Active'],
                ...(detailUser.suspended && detailUser.suspensionReason ? [['Suspension reason', detailUser.suspensionReason]] : [])
              ].map(([label, value]) =>
                <div key={label} className="flex justify-between items-center gap-4 py-2.5">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="font-medium text-ink">
                    {label === 'Gender' ? (
                      <Badge
                        tone={
                          detailUser.gender?.toLowerCase() === 'woman'
                            ? 'berry'
                            : detailUser.gender?.toLowerCase() === 'man'
                            ? 'indigo'
                            : 'neutral'
                        }
                      >
                        {value}
                      </Badge>
                    ) : label === 'Verification' ? (
                      <Badge tone={detailUser.verified ? 'moss' : 'amber'}>
                        {value}
                      </Badge>
                    ) : label === 'Account state' ? (
                      <Badge tone={detailUser.suspended ? 'red' : 'moss'}>
                        {value}
                      </Badge>
                    ) : label === 'Unlimited access' && detailUser.isUnlimited ? (
                      <Badge tone="indigo">{value}</Badge>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        }
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this member?"
        description="Their profile and photos are removed permanently. Payment records are retained for accounting."
        footer={
        <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                const toDelete = pendingDelete;
                setPendingDelete(null);
                if (!toDelete) return;
                setRealUsers(prev => prev ? prev.filter(u => u.id !== toDelete) : null);
                try {
                  const res = await deleteUserAction(toDelete);
                  if (res.ok) {
                    toast.success('Member deleted');
                  } else {
                    toast.error(res.error || 'Failed to delete member');
                  }
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to delete member');
                }
              }}
            >
              Delete member
            </Button>
          </>
        } />

      {/* Suspend user reason modal */}
      <Modal
        open={!!suspendingUser}
        onClose={() => { setSuspendingUser(null); setSuspensionReason(''); }}
        title={`Suspend ${suspendingUser?.name}?`}
        description="Provide a note or reason explaining why this member is being suspended. They will be immediately blocked from signing in and will see this reason when attempting to log in."
        footer={
          <>
            <Button variant="ghost" onClick={() => { setSuspendingUser(null); setSuspensionReason(''); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!suspensionReason.trim() || Boolean(suspendingUser && busyIds[suspendingUser.id])}
              onClick={async () => {
                const target = suspendingUser;
                const reason = suspensionReason.trim();
                if (!target || !reason) return;
                setSuspendingUser(null);
                setSuspensionReason('');
                await executeSuspendUser(target, true, reason);
              }}
            >
              Suspend Member
            </Button>
          </>
        }
      >
        <div className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Reason for suspension <span className="text-berry-500">*</span>
            </label>
            <textarea
              rows={3}
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="e.g. Inappropriate messages violating community safety rules, fake profile, repeated harassment..."
              className="w-full rounded-xl border border-sand bg-cream px-3 py-2 text-sm text-ink outline-none transition focus:border-plum focus:ring-1 focus:ring-plum/30 placeholder:text-ink-muted/50"
              autoFocus
            />
          </div>

          <div>
            <p className="text-xs font-medium text-ink-muted mb-1.5">Quick presets:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Inappropriate messages or harassment',
                'Fake profile or impersonation',
                'Spam, advertising, or solicitation',
                'Multiple reports from community members',
                'Violation of community safety guidelines'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSuspensionReason(preset)}
                  className="rounded-full bg-cream-deep px-2.5 py-1 text-[11px] font-medium text-ink-soft border border-sand hover:bg-sand/60 hover:text-ink transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
      
    </div>);

}
