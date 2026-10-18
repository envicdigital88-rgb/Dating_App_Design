'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  ShieldCheckIcon, 
  UserPlusIcon, 
  SearchIcon, 
  MailIcon, 
  Trash2Icon, 
  KeyIcon,
  RefreshCwIcon,
  SparklesIcon,
  LockIcon
} from 'lucide-react';
import { AdminHeader, StatTile } from './AdminShell';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Bits';
import { shortDate, relativeTime } from '@/lib/utils/format';
import { useStore } from '@/lib/contexts/StoreContext';
import { 
  getAdminListAction, 
  addAdminAction, 
  removeAdminAction, 
  resendAdminInviteAction 
} from '@/app/actions/admin';

interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  suspended: boolean;
  createdAt: string;
  lastActiveAt: string;
  isSuperAdmin: boolean;
}

export function AdminManagement() {
  const { currentUser } = useStore();
  const [admins, setAdmins] = useState<AdminMember[] | null>(null);
  const [isCallerSuperAdmin, setIsCallerSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isSuperAdmin = currentUser?.email === 'envicdigital88@gmail.com' || isCallerSuperAdmin;
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Revoke state
  const [pendingRevoke, setPendingRevoke] = useState<AdminMember | null>(null);
  const [revoking, setRevoking] = useState(false);
  
  // Resend state
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchAdmins = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await getAdminListAction();
      if (res.ok && res.data) {
        setAdmins(res.data as AdminMember[]);
        if (res.isCallerSuperAdmin !== undefined) {
          setIsCallerSuperAdmin(Boolean(res.isCallerSuperAdmin));
        }
      } else {
        if (isManual) toast.error('Failed to load administrators');
      }
    } catch (err) {
      console.error('Fetch admins error:', err);
      if (isManual) toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchAdmins();
    
    const interval = setInterval(() => {
      if (mounted) fetchAdmins();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please provide both name and email.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await addAdminAction({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: useCustomPassword ? customPassword.trim() : undefined
      });

      if (res.ok) {
        toast.success(`Admin added! Access details sent from noreply@winglemingle.com to ${email}`);
        setIsAddModalOpen(false);
        setName('');
        setEmail('');
        setCustomPassword('');
        setUseCustomPassword(false);
        fetchAdmins();
      } else {
        toast.error(res.error || 'Failed to add administrator');
      }
    } catch (err: any) {
      toast.error('An error occurred while adding the administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!pendingRevoke) return;
    setRevoking(true);
    try {
      const res = await removeAdminAction(pendingRevoke.id);
      if (res.ok) {
        toast.success(`Administrator privileges revoked for ${pendingRevoke.name}`);
        setPendingRevoke(null);
        fetchAdmins();
      } else {
        toast.error(res.error || 'Failed to revoke administrator privileges');
      }
    } catch (err) {
      toast.error('Failed to revoke admin');
    } finally {
      setRevoking(false);
    }
  };

  const handleResendInvite = async (admin: AdminMember) => {
    setResendingId(admin.id);
    try {
      const res = await resendAdminInviteAction(admin.id);
      if (res.ok) {
        toast.success(`Access credentials and instructions resent from noreply@winglemingle.com to ${admin.email}`);
      } else {
        toast.error(res.error || 'Failed to resend access email');
      }
    } catch (err) {
      toast.error('Failed to resend email');
    } finally {
      setResendingId(null);
    }
  };

  const filteredAdmins = useMemo(() => {
    if (!admins) return [];
    return admins.filter(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [admins, searchQuery]);

  if (loading && !admins) {
    return (
      <div>
        <AdminHeader
          title="Admins & Team"
          body="Manage administrators with elevated privileges and access to the Wingle Mingle admin console." />
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-ink-muted">
          <RefreshCwIcon className="h-6 w-6 animate-spin text-berry-500" />
          <p className="text-sm">Loading administrator team...</p>
        </div>
      </div>
    );
  }

  const superAdminsCount = (admins || []).filter(a => a.isSuperAdmin).length;
  const regularAdminsCount = (admins || []).filter(a => !a.isSuperAdmin).length;

  return (
    <div>
      <AdminHeader
        title="Admin team"
        body="Manage platform administrators. When a new administrator is registered, an automated dispatch with credentials is sent from noreply@winglemingle.com, allowing instant login via email or Google sign-in."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAdmins(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-full bg-cream-deep px-3.5 py-2 text-xs font-medium text-ink hover:bg-sand/60 transition-colors disabled:opacity-50"
              title="Refresh administrator list"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {isSuperAdmin ? (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <UserPlusIcon className="h-4 w-4" />
                Add new admin
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-cream-deep px-3.5 py-2 text-xs font-medium text-ink-muted border border-sand/60">
                <LockIcon className="h-3.5 w-3.5 text-berry-400" />
                Super Admin Only
              </div>
            )}
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile 
          label="Total administrators" 
          value={admins?.length ?? 0} 
        />
        <StatTile 
          label="Super administrators" 
          value={superAdminsCount} 
          hint="Primary system controller"
        />
        <StatTile 
          label="Delegated administrators" 
          value={regularAdminsCount} 
          emphasis
        />
      </div>

      {/* Delegated Admin View Notice */}
      {!isSuperAdmin && (
        <div className="mt-6 rounded-3xl bg-cream-deep border border-sand/60 p-4 flex items-start gap-3 text-xs text-ink-muted shadow-card">
          <div className="p-2 rounded-xl bg-berry-500/10 text-berry-400 shrink-0 mt-0.5">
            <LockIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-ink text-[13px]">Delegated Administrator Mode</p>
            <p className="mt-0.5 leading-relaxed">
              You are signed in as a delegated administrator. You have viewing privileges for the administrator team, but only the Super Administrator (<strong className="text-berry-400">envicdigital88@gmail.com</strong>) has authorization to add, remove, or modify administrator accounts.
            </p>
          </div>
        </div>
      )}

      {/* Admins Table Section */}
      <section className="mt-8 overflow-hidden rounded-4xl bg-cream-deep shadow-card border border-sand/40">
        <div className="border-b border-sand p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-ink">
              Platform administrators
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Authorized team members who can sign in and manage the console
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full bg-cream border border-sand text-ink placeholder:text-ink-muted focus:outline-none focus:border-berry-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-sand text-[12px] uppercase tracking-[0.06em] text-ink-muted bg-cream/40">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Administrator</th>
                <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                <th scope="col" className="hidden px-5 py-3 font-semibold md:table-cell">Added</th>
                <th scope="col" className="hidden px-5 py-3 font-semibold lg:table-cell">Last active</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-ink-muted text-sm">
                    No administrators match your query.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isCurrent = currentUser?.id === admin.id;
                  const isPrimary = admin.isSuperAdmin;
                  const isResending = resendingId === admin.id;

                  return (
                    <tr key={admin.id} className="hover:bg-cream/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-berry-500/20 text-berry-400 font-bold flex items-center justify-center text-sm shrink-0">
                              {admin.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-cream-deep border border-sand flex items-center justify-center text-[10px]">
                              🛡️
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink">{admin.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-berry-500/20 text-berry-400 font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="block text-[12px] text-ink-muted">
                              {admin.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={isPrimary ? 'plum' : 'berry'}>
                          {isPrimary ? 'Super Admin' : 'Admin'}
                        </Badge>
                      </td>
                      <td className="hidden px-5 py-4 text-ink-soft md:table-cell text-sm">
                        {shortDate(admin.createdAt)}
                      </td>
                      <td className="hidden px-5 py-4 text-ink-muted lg:table-cell text-xs">
                        Active {relativeTime(admin.lastActiveAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isSuperAdmin ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleResendInvite(admin)}
                              disabled={isResending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-sand/60 text-ink-soft hover:bg-sand hover:text-ink transition-colors disabled:opacity-50"
                              title="Resend login credentials via email"
                            >
                              <MailIcon className={`h-3.5 w-3.5 ${isResending ? 'animate-bounce text-berry-400' : ''}`} />
                              Resend Access
                            </button>

                            {!isPrimary && !isCurrent && (
                              <button
                                onClick={() => setPendingRevoke(admin)}
                                className="inline-flex items-center p-1.5 text-xs rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                title="Revoke administrator privileges"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-ink-muted italic font-medium">
                            {isPrimary ? 'Super Admin' : 'View only'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Admin Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => !submitting && setIsAddModalOpen(false)}
        title="Add New Administrator"
      >
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <p className="text-xs text-ink-muted">
            The new administrator will receive an email from <span className="font-semibold text-berry-400">noreply@winglemingle.com</span> containing login instructions and credentials. They can also sign in directly using Google OAuth with their Gmail account.
          </p>

          <div>
            <Label htmlFor="admin-name">Full Name</Label>
            <Input
              id="admin-name"
              type="text"
              required
              placeholder="e.g. Kasun Fernando"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="admin-email">Admin Gmail / Email Address</Label>
            <Input
              id="admin-email"
              type="email"
              required
              placeholder="e.g. kasun@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setUseCustomPassword(!useCustomPassword)}
              className="text-xs text-berry-400 hover:text-berry-300 font-medium flex items-center gap-1.5 transition-colors"
            >
              <KeyIcon className="h-3.5 w-3.5" />
              {useCustomPassword ? 'Use auto-generated secure password' : 'Set custom temporary password'}
            </button>

            {useCustomPassword && (
              <div className="mt-2.5">
                <Label htmlFor="custom-password">Custom Temporary Password</Label>
                <Input
                  id="custom-password"
                  type="text"
                  placeholder="Enter temporary password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-cream p-3.5 border border-sand/50 text-xs text-ink-muted space-y-1">
            <div className="flex items-center gap-1.5 text-ink-soft font-semibold">
              <SparklesIcon className="h-3.5 w-3.5 text-berry-400" />
              Automatic Provisioning & Access
            </div>
            <p>
              • An access dispatch is emailed to <strong className="text-ink">{email || 'their Gmail'}</strong> from <span className="text-berry-400">noreply@winglemingle.com</span>.<br />
              • The admin can sign in via their password or Google Gmail button at any time.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !name.trim() || !email.trim()}
            >
              {submitting ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 animate-spin" />
                  Granting access...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="h-4 w-4" />
                  Grant Admin Access
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Revoke Admin Confirmation Modal */}
      <Modal
        open={Boolean(pendingRevoke)}
        onClose={() => !revoking && setPendingRevoke(null)}
        title="Revoke Admin Access"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">
            Are you sure you want to revoke administrator access for <strong className="text-ink">{pendingRevoke?.name}</strong> (<span className="text-ink-muted">{pendingRevoke?.email}</span>)?
          </p>
          <p className="text-xs text-ink-muted">
            Their role will be changed back to a standard member. They will immediately lose access to the Admin Console.
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="outline"
              disabled={revoking}
              onClick={() => setPendingRevoke(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={revoking}
              onClick={handleRevoke}
            >
              {revoking ? 'Revoking...' : 'Revoke Administrator'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
