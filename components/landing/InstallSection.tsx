'use client';

import React from 'react';
import { BellIcon, DownloadIcon, SmartphoneIcon, WifiOffIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { usePwa } from '../PwaProvider';
import { seedPhotos } from '@/lib/data/seed';

const preview = seedPhotos.find((p) => p.userId === 'u-5')?.url;

export function InstallSection() {
  const { promptInstall, installed, enableNotifications, notificationsEnabled } = usePwa();

  return (
    <section className="border-b border-sand/60 py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1fr_0.8fr] lg:gap-20 lg:px-8">
        <div>
          <p className="mb-3 text-[13px] font-semibold text-berry-500">Install Wingle Mingle</p>
          <h2 className="font-display text-3xl leading-[1.1] text-ink sm:text-4xl">
            Put it on your home screen, skip the app store
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            Wingle Mingle installs straight from your browser and runs full screen, with push notifications
            for new wingles and mingles, and an offline fallback for the tube.
          </p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
            { icon: <SmartphoneIcon className="h-4 w-4" />, label: 'Full-screen app' },
            { icon: <BellIcon className="h-4 w-4" />, label: 'Push notifications' },
            { icon: <WifiOffIcon className="h-4 w-4" />, label: 'Works offline' }].
            map((f) =>
            <li key={f.label} className="flex items-center gap-2.5 text-[14px] text-ink-soft">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-berry-50 text-berry-500">
                  {f.icon}
                </span>
                {f.label}
              </li>
            )}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={promptInstall} disabled={installed}>
              <DownloadIcon className="h-4 w-4" />
              {installed ? 'Installed' : 'Install Wingle Mingle'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={enableNotifications}
              disabled={notificationsEnabled}>
              
              {notificationsEnabled ? 'Notifications on' : 'Enable notifications'}
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[300px]">
          <div className="rounded-[2.75rem] border-[10px] border-plum-600 bg-plum-600 shadow-lift">
            <div className="overflow-hidden rounded-[2rem] bg-cream">
              <div className="flex items-center justify-between px-4 py-2 text-[11px] font-medium text-ink-muted">
                <span>9:41</span>
                <span>Wingle Mingle</span>
              </div>
              {preview && <img src={preview} alt="" className="aspect-[3/4] w-full object-cover" />}
              <div className="p-4">
                <p className="font-display text-lg text-ink">Sophie, 28</p>
                <p className="mt-1 text-[12px] text-ink-muted">Margate · Online now</p>
                <div className="mt-3 flex gap-2">
                  <span className="h-9 flex-1 rounded-full bg-berry-500" />
                  <span className="h-9 w-9 rounded-full border border-sand bg-cream-deep" />
                </div>
              </div>
              <div className="flex justify-around border-t border-sand bg-cream-deep px-4 py-2.5 text-ink-muted">
                {['Discover', 'Wingles', 'Chat', 'You'].map((tab, i) =>
                <span
                  key={tab}
                  className={`text-[10px] font-medium ${i === 0 ? 'text-berry-500' : ''}`}>
                  
                    {tab}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}
