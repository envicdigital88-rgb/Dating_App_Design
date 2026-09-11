'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2Icon, SearchIcon, Trash2Icon } from 'lucide-react';
import { AdminHeader } from './AdminShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Avatar, Badge } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { relativeTime, shortDate } from '@/lib/utils/format';

export function AdminUsers() {
  const { db, photosOf, setUserSuspended, setUserVerified, removeUser } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'suspended'>('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const users = db.users.
  filter((u) => u.role === 'member').
  filter((u) =>
  `${u.name} ${u.email} ${u.location}`.toLowerCase().includes(query.trim().toLowerCase())
  ).
  filter((u) =>
  filter === 'all' ?
  true :
  filter === 'verified' ?
  u.verified :
  filter === 'unverified' ?
  !u.verified :
  u.suspended
  );

  const detailUser = db.users.find((u) => u.id === detail);

  return (
    <div>
      <AdminHeader
        title="User management"
        body="Search, review, verify and suspend members. Suspended members cannot sign in and are hidden from Discover." />
      

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or area"
            className="pl-11"
            aria-label="Search users" />
          
        </div>
        <div className="inline-flex rounded-full bg-cream-deep p-1">
          {(['all', 'verified', 'unverified', 'suspended'] as const).map((key) =>
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] capitalize transition-colors duration-150 ease-soft ${
            filter === key ? 'bg-cream-deep text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`
            }>
            
              {key}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-4xl bg-cream-deep shadow-card">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-sand text-[12px] uppercase tracking-[0.06em] text-ink-muted">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Member</th>
              <th scope="col" className="hidden px-5 py-3 font-semibold md:table-cell">Joined</th>
              <th scope="col" className="hidden px-5 py-3 font-semibold lg:table-cell">Last active</th>
              <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {users.map((user) =>
            <tr key={user.id} className="align-middle">
                <td className="px-5 py-3.5">
                  <button
                  onClick={() => setDetail(user.id)}
                  className="flex items-center gap-3 text-left">
                  
                    <Avatar src={photosOf(user.id)[0]?.url} name={user.name} size={38} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {user.name}, {user.age}
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
                  {user.suspended ?
                <Badge tone="red">Suspended</Badge> :
                user.verified ?
                <Badge tone="moss">Verified</Badge> :

                <Badge tone="amber">Unverified</Badge>
                }
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1.5">
                    <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setUserVerified(user.id, !user.verified);
                      toast.success(user.verified ? 'Verification removed' : 'Member verified');
                    }}>
                    
                      <CheckCircle2Icon className="h-3.5 w-3.5" />
                      {user.verified ? 'Unverify' : 'Verify'}
                    </Button>
                    <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setUserSuspended(user.id, !user.suspended);
                      toast.success(user.suspended ? 'Member reinstated' : 'Member suspended');
                    }}>
                    
                      {user.suspended ? 'Reinstate' : 'Suspend'}
                    </Button>
                    <Button
                    size="sm"
                    variant="danger"
                    aria-label={`Delete ${user.name}`}
                    onClick={() => setPendingDelete(user.id)}>
                    
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
      </div>

      <Modal
        open={!!detailUser}
        onClose={() => setDetail(null)}
        title={detailUser ? `${detailUser.name}, ${detailUser.age}` : ''}
        description={detailUser?.email}
        size="md">
        
        {detailUser &&
        <div className="space-y-4">
            <ul className="flex gap-2">
              {photosOf(detailUser.id).map((photo) =>
            <li key={photo.id}>
                  <img src={photo.url} alt="" className="h-24 w-20 rounded-2xl object-cover" />
                </li>
            )}
            </ul>
            <p className="text-[14px] leading-relaxed text-ink-soft">{detailUser.bio}</p>
            <dl className="divide-y divide-sand border-y border-sand text-[13px]">
              {[
            ['Location', detailUser.location],
            ['Intention', detailUser.intention],
            ['Requests sent', String(db.requests.filter((r) => r.fromUserId === detailUser.id).length)],
            ['Requests received', String(db.requests.filter((r) => r.toUserId === detailUser.id).length)],
            ['Messages sent', String(db.messages.filter((m) => m.senderId === detailUser.id).length)],
            ['Reports against', String(db.reports.filter((r) => r.targetUserId === detailUser.id).length)]].
            map(([label, value]) =>
            <div key={label} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="font-medium text-ink">{value}</dd>
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
            onClick={() => {
              removeUser(pendingDelete as string);
              setPendingDelete(null);
              toast.success('Member deleted');
            }}>
            
              Delete member
            </Button>
          </>
        } />
      
    </div>);

}
