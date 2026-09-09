'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BanIcon, BellIcon, DownloadIcon, LogOutIcon, ShieldCheckIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/lib/contexts/StoreContext';
import { usePwa } from '@/components/PwaProvider';

export function Settings() {
  const router = useRouter();
  const { currentUser, db, updateProfile, unblockUser, userById, logout, deleteAccount } = useStore();
  const { promptInstall, installed, notificationsEnabled, enableNotifications } = usePwa();
  const [deleting, setDeleting] = useState(false);
  const [privacy, setPrivacy] = useState({
    showOnline: true,
    showDistance: true,
    readReceipts: true,
    discoverable: true
  });

  if (!currentUser) return null;

  const blocked = db.blocks.filter((b) => b.blockerId === currentUser.id);

  return (
    <Page>
      <PageHeader title="Settings" body="Account, privacy, notifications and app options." />

      <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
        <section className="rounded-4xl bg-white p-6 shadow-card">
          <h2 className="font-display text-xl text-ink">Account</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                value={currentUser.email}
                onChange={(e) => updateProfile({ email: e.target.value })} />
              
            </div>
            <div>
              <Label htmlFor="settings-phone">Mobile number</Label>
              <Input
                id="settings-phone"
                value={currentUser.phone}
                onChange={(e) => updateProfile({ phone: e.target.value })} />
              
              <p className="mt-1.5 text-[12px] text-ink-muted">
                Never shown on your profile. Used for account recovery only.
              </p>
            </div>
            <Button variant="outline" onClick={() => toast.success('Account details saved')}>
              Save account details
            </Button>
          </div>
        </section>

        <section className="rounded-4xl bg-white p-6 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-xl text-ink">
            <ShieldCheckIcon className="h-4 w-4 text-moss" />
            Privacy
          </h2>
          <ul className="mt-4 divide-y divide-sand">
            {(
            [
            ['discoverable', 'Show me in Discover', 'Turn off to hide your profile completely.'],
            ['showOnline', 'Show when I am online', 'Others see “Online now” on your profile.'],
            ['showDistance', 'Show my area', 'Only ever your area, never an exact location.'],
            ['readReceipts', 'Read receipts', 'Let connections see when you have read a message.']] as
            const).
            map(([key, label, hint]) =>
            <li key={key} className="flex items-start justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-ink">{label}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{hint}</p>
                </div>
                <button
                role="switch"
                aria-checked={privacy[key]}
                aria-label={label}
                onClick={() => setPrivacy((p) => ({ ...p, [key]: !p[key] }))}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ease-soft ${
                privacy[key] ? 'bg-berry-500' : 'bg-sand'}`
                }>
                
                  <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150 ease-soft ${
                  privacy[key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`
                  } />
                
                </button>
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-4xl bg-white p-6 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-xl text-ink">
            <BanIcon className="h-4 w-4 text-ink-muted" />
            Blocked members · {blocked.length}
          </h2>
          {blocked.length === 0 ?
          <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
              You have not blocked anyone. Blocking removes someone from your Discover, requests and
              inbox at once.
            </p> :

          <ul className="mt-3 divide-y divide-sand">
              {blocked.map((block) => {
              const user = userById(block.blockedUserId);
              return (
                <li key={block.id} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-[14px] text-ink">{user?.name ?? 'Former member'}</span>
                    <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      unblockUser(block.blockedUserId);
                      toast.success('Member unblocked');
                    }}>
                    
                      Unblock
                    </Button>
                  </li>);

            })}
            </ul>
          }
        </section>

        <section className="rounded-4xl bg-white p-6 shadow-card">
          <h2 className="font-display text-xl text-ink">App</h2>
          <div className="mt-4 space-y-3">
            <Button variant="outline" block onClick={promptInstall} disabled={installed}>
              <DownloadIcon className="h-4 w-4" />
              {installed ? 'Kindred is installed' : 'Install Kindred on this device'}
            </Button>
            <Button
              variant="outline"
              block
              onClick={enableNotifications}
              disabled={notificationsEnabled}>
              
              <BellIcon className="h-4 w-4" />
              {notificationsEnabled ? 'Push notifications on' : 'Enable push notifications'}
            </Button>
            <Button
              variant="outline"
              block
              onClick={() => {
                logout();
                router.push('/');
              }}>
              
              <LogOutIcon className="h-4 w-4" />
              Sign out
            </Button>
            <Button variant="danger" block onClick={() => setDeleting(true)}>
              Delete my account
            </Button>
          </div>
        </section>
      </div>

      <Modal
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete your account?"
        description="Your profile, photos, requests and conversations are permanently removed. This cannot be undone."
        footer={
        <>
            <Button variant="ghost" onClick={() => setDeleting(false)}>
              Keep my account
            </Button>
            <Button
            variant="danger"
            onClick={() => {
              deleteAccount();
              toast.success('Your account has been deleted');
              router.push('/');
            }}>
            
              Delete permanently
            </Button>
          </>
        } />
      
    </Page>);

}