'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckIcon, FlagIcon, XIcon } from 'lucide-react';
import { AdminHeader } from './AdminShell';
import { Button } from '@/components/ui/Button';
import { Badge, EmptyState } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { relativeTime } from '@/lib/utils/format';

export function AdminModeration() {
  const { db, moderatePhoto, resolveReport, setUserSuspended } = useStore();
  const [tab, setTab] = useState<'photos' | 'reports'>('photos');

  const queue = db.photos.filter((p) => p.moderation === 'pending');
  const reports = db.reports;

  return (
    <div>
      <AdminHeader
        title="Profile & photo moderation"
        body="New photos are held in review before they appear in Discover. Reports are reviewed here and actioned against the member." />
      

      <div role="tablist" className="mb-5 inline-flex rounded-full bg-cream-deep p-1">
        {(
        [
        ['photos', `Photo queue · ${queue.length}`],
        ['reports', `Reports · ${reports.filter((r) => r.status === 'open').length}`]] as
        const).
        map(([key, label]) =>
        <button
          key={key}
          role="tab"
          aria-selected={tab === key}
          onClick={() => setTab(key)}
          className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-soft ${
          tab === key ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`
          }>
          
            {label}
          </button>
        )}
      </div>

      {tab === 'photos' && (
      queue.length === 0 ?
      <EmptyState
        icon={<CheckIcon className="h-5 w-5" />}
        title="Photo queue is clear"
        body="Every uploaded photo has been reviewed. New uploads will appear here automatically." /> :


      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {queue.map((photo) => {
          const owner = db.users.find((u) => u.id === photo.userId);
          return (
            <li key={photo.id} className="overflow-hidden rounded-4xl bg-white shadow-card">
                  <img src={photo.url} alt="" className="aspect-[4/3] w-full object-cover" />
                  <div className="p-4">
                    <p className="font-medium text-ink">{owner?.name ?? 'Member'}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      Uploaded {relativeTime(photo.uploadedAt)} · position {photo.order + 1}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                    size="sm"
                    block
                    onClick={() => {
                      moderatePhoto(photo.id, 'approved');
                      toast.success('Photo approved');
                    }}>
                    
                        <CheckIcon className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                    size="sm"
                    block
                    variant="danger"
                    onClick={() => {
                      moderatePhoto(photo.id, 'rejected');
                      toast.success('Photo removed');
                    }}>
                    
                        <XIcon className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>);

        })}
          </ul>)
      }

      {tab === 'reports' && (
      reports.length === 0 ?
      <EmptyState
        icon={<FlagIcon className="h-5 w-5" />}
        title="No reports"
        body="Reported profiles, photos and messages appear here with the reporter kept anonymous." /> :


      <ul className="space-y-3">
            {reports.map((report) => {
          const target = db.users.find((u) => u.id === report.targetUserId);
          return (
            <li
              key={report.id}
              className="flex flex-wrap items-start gap-4 rounded-4xl bg-white p-5 shadow-card">
              
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{report.reason}</p>
                      <Badge tone="neutral">{report.context}</Badge>
                      <Badge
                    tone={
                    report.status === 'open' ?
                    'amber' :
                    report.status === 'resolved' ?
                    'moss' :
                    'neutral'
                    }>
                    
                        {report.status}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-[13px] text-ink-soft">
                      Against <span className="font-medium text-ink">{target?.name ?? 'member'}</span>{' '}
                      · {relativeTime(report.createdAt)}
                    </p>
                    {report.detail &&
                <p className="mt-2 rounded-2xl bg-cream px-3.5 py-2 text-[13px] leading-relaxed text-ink-soft">
                        {report.detail}
                      </p>
                }
                  </div>
                  {report.status === 'open' &&
              <div className="flex flex-wrap gap-2">
                      <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    resolveReport(report.id, 'dismissed');
                    toast.success('Report dismissed');
                  }}>
                  
                        Dismiss
                      </Button>
                      <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setUserSuspended(report.targetUserId, true);
                    resolveReport(report.id, 'resolved');
                    toast.success('Member suspended and report resolved');
                  }}>
                  
                        Suspend member
                      </Button>
                      <Button
                  size="sm"
                  onClick={() => {
                    resolveReport(report.id, 'resolved');
                    toast.success('Report resolved');
                  }}>
                  
                        Resolve
                      </Button>
                    </div>
              }
                </li>);

        })}
          </ul>)
      }
    </div>);

}