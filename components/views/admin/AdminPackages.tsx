'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { AdminHeader } from './AdminShell';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { id as makeId, money } from '@/lib/utils/format';
import type { Package } from '@/lib/types';

const blank = (): Package => ({
  id: makeId('pkg'),
  name: '',
  price: 9.99,
  durationDays: 30,
  chatLimit: 50,
  wingleLimit: 10,
  incomingWinglesUnlocked: true,
  priorityVisibility: false,
  tagline: '',
  features: [],
  active: true
});

export function AdminPackages() {
  const { db, savePackage, deletePackage } = useStore();
  const [editing, setEditing] = useState<Package | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const set = <K extends keyof Package,>(key: K, value: Package[K]) =>
  setEditing((p) => p ? { ...p, [key]: value } : p);

  return (
    <div>
      <AdminHeader
        title="Package management"
        body="Limits live here, not in the app. Changing a chat or wingle limit applies to every member on that package immediately."
        action={
        <Button onClick={() => setEditing(blank())}>
            <PlusIcon className="h-4 w-4" />
            New package
          </Button>
        } />
      

      <div className="overflow-x-auto rounded-4xl bg-cream-deep shadow-card">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <thead className="border-b border-sand text-[12px] uppercase tracking-[0.06em] text-ink-muted">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Package</th>
              <th scope="col" className="px-5 py-3 font-semibold">Price</th>
              <th scope="col" className="px-5 py-3 font-semibold">Duration</th>
              <th scope="col" className="px-5 py-3 font-semibold">Chat limit</th>
              <th scope="col" className="px-5 py-3 font-semibold">Wingle limit</th>
              <th scope="col" className="px-5 py-3 font-semibold">Incoming</th>
              <th scope="col" className="px-5 py-3 font-semibold">State</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {[...db.packages].
            sort((a, b) => a.price - b.price).
            map((pkg) =>
            <tr key={pkg.id}>
                  <td className="px-5 py-3.5">
                    <span className="block font-medium text-ink">{pkg.name}</span>
                    <span className="block max-w-[260px] truncate text-[12px] text-ink-muted">
                      {pkg.tagline}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{money(pkg.price)}</td>
                  <td className="px-5 py-3.5 text-ink-soft">
                    {pkg.durationDays === 0 ? '—' : `${pkg.durationDays} days`}
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">
                    {pkg.chatLimit === null ? 'Unlimited' : pkg.chatLimit}
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">
                    {pkg.wingleLimit === null ? 'Unlimited' : pkg.wingleLimit}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={pkg.incomingWinglesUnlocked ? 'moss' : 'neutral'}>
                      {pkg.incomingWinglesUnlocked ? 'Revealed' : 'Locked'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={pkg.active ? 'moss' : 'red'}>{pkg.active ? 'Live' : 'Hidden'}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setEditing({ ...pkg })}>
                        <PencilIcon className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                    size="sm"
                    variant="danger"
                    aria-label={`Delete ${pkg.name}`}
                    onClick={() => setPendingDelete(pkg.id)}>
                    
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing && db.packages.some((p) => p.id === editing.id) ? 'Edit package' : 'New package'}
        description="These values are the single source of truth for what members can do."
        size="lg"
        footer={
        <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
            onClick={() => {
              if (!editing) return;
              if (!editing.name.trim()) {
                toast.error('Give the package a name.');
                return;
              }
              savePackage({
                ...editing,
                features: editing.features.filter((f) => f.trim())
              });
              setEditing(null);
              toast.success('Package saved — limits are live immediately');
            }}>
            
              Save package
            </Button>
          </>
        }>
        
        {editing &&
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pkg-name">Name</Label>
                <Input
                id="pkg-name"
                value={editing.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Premium" />
              
              </div>
              <div>
                <Label htmlFor="pkg-price">Price (£)</Label>
                <Input
                id="pkg-price"
                type="number"
                step="0.01"
                min="0"
                value={editing.price}
                onChange={(e) => set('price', Number(e.target.value))} />
              
              </div>
              <div>
                <Label htmlFor="pkg-duration">Duration (days)</Label>
                <Input
                id="pkg-duration"
                type="number"
                min="0"
                value={editing.durationDays}
                onChange={(e) => set('durationDays', Number(e.target.value))} />
              
              </div>
              <div>
                <Label htmlFor="pkg-chat">Chat mingle limit</Label>
                <Input
                id="pkg-chat"
                type="number"
                min="0"
                value={editing.chatLimit ?? ''}
                placeholder="Leave empty for unlimited"
                onChange={(e) =>
                set('chatLimit', e.target.value === '' ? null : Number(e.target.value))
                } />
              
              </div>
              <div>
                <Label htmlFor="pkg-wingles">Wingling wingle limit</Label>
                <Input
                id="pkg-wingles"
                type="number"
                min="0"
                value={editing.wingleLimit ?? ''}
                placeholder="Leave empty for unlimited"
                onChange={(e) =>
                set('wingleLimit', e.target.value === '' ? null : Number(e.target.value))
                } />
              
              </div>
              <div>
                <Label htmlFor="pkg-tagline">Tagline</Label>
                <Input
                id="pkg-tagline"
                value={editing.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="Talk freely and be seen first." />
              
              </div>
            </div>

            <div>
              <Label htmlFor="pkg-features">Features (one per line)</Label>
              <Textarea
              id="pkg-features"
              value={editing.features.join('\n')}
              onChange={(e) => set('features', e.target.value.split('\n'))} />
            
            </div>

            <ul className="space-y-2">
              {(
            [
            ['incomingWinglesUnlocked', 'Reveal incoming wingling wingles'],
            ['priorityVisibility', 'Priority profile visibility in Discover'],
            ['active', 'Show this package to members']] as
            const).
            map(([key, label]) =>
            <li key={key} className="flex items-center justify-between gap-4 rounded-2xl bg-cream px-4 py-3">
                  <span className="text-[14px] text-ink">{label}</span>
                  <button
                role="switch"
                aria-checked={editing[key]}
                aria-label={label}
                onClick={() => set(key, !editing[key])}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ease-soft ${
                editing[key] ? 'bg-berry-500' : 'bg-sand'}`
                }>
                
                    <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream-deep shadow-sm transition-transform duration-150 ease-soft ${
                  editing[key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`
                  } />
                
                  </button>
                </li>
            )}
            </ul>
          </div>
        }
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this package?"
        description="Members currently on it keep their allowance until it expires, but nobody new can buy it."
        footer={
        <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
            variant="danger"
            onClick={() => {
              deletePackage(pendingDelete as string);
              setPendingDelete(null);
              toast.success('Package deleted');
            }}>
            
              Delete package
            </Button>
          </>
        } />
      
    </div>);

}
