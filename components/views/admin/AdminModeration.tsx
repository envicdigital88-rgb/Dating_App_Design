'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckIcon, FlagIcon, XIcon, ShieldCheckIcon, CameraIcon, Loader2Icon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { AdminHeader } from './AdminShell';
import { Button } from '@/components/ui/Button';
import { Badge, EmptyState } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { relativeTime } from '@/lib/utils/format';
import { getAdminModerationDataAction, moderateSelfieAction } from '@/app/actions/admin';
import type { Report, Photo } from '@/lib/types';

interface AdminSelfieItem {
  userId: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  location: string;
  verificationSelfie: string;
  selfieStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  photos: {
    id: string;
    url: string;
    order: number;
    isPrimary: boolean;
  }[];
}

export function AdminModeration() {
  const { db, moderatePhoto, resolveReport, setUserSuspended } = useStore();
  const [tab, setTab] = useState<'selfies' | 'photos' | 'reports'>('selfies');
  const [realReports, setRealReports] = useState<Report[]>([]);
  const [realPhotos, setRealPhotos] = useState<Photo[]>([]);
  const [realSelfies, setRealSelfies] = useState<AdminSelfieItem[]>([]);
  const [selfieFilter, setSelfieFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  const [busySelfieId, setBusySelfieId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      const res = await getAdminModerationDataAction();
      if (res.ok && mounted) {
        setRealReports(res.reports as unknown as Report[]);
        setRealPhotos(res.photos as unknown as Photo[]);
        if (res.selfies) {
          setRealSelfies(res.selfies as unknown as AdminSelfieItem[]);
        }
      }
    };
    fetchData();
    
    const interval = setInterval(fetchData, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleModerateSelfie = async (userId: string, status: 'approved' | 'rejected') => {
    setBusySelfieId(userId);
    try {
      const res = await moderateSelfieAction(userId, status);
      if (res.ok) {
        setRealSelfies(prev => prev.map(s => s.userId === userId ? { ...s, selfieStatus: status, verificationSelfie: '', photos: [] } : s));
        toast.success(status === 'approved' ? 'Selfie approved & verified!' : 'Selfie rejected');
        window.dispatchEvent(new CustomEvent('admin-moderation-updated'));
      } else {
        toast.error(res.error || 'Failed to update selfie status');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setBusySelfieId(null);
    }
  };

  const queue = realPhotos;
  const reports = realReports;
  const pendingSelfiesCount = realSelfies.filter(s => s.selfieStatus === 'pending').length;

  const filteredSelfies = realSelfies.filter(s => {
    if (selfieFilter === 'all') return true;
    return s.selfieStatus === selfieFilter;
  });

  return (
    <div>
      <AdminHeader
        title="Profile & photo moderation"
        body="Review member verification selfies, moderate public photo uploads, and resolve flagged reports." 
      />

      {/* Main Tab Navigation */}
      <div role="tablist" className="mb-5 inline-flex rounded-full bg-cream-deep p-1">
        {([
          ['selfies', `Selfie Approvals · ${pendingSelfiesCount}`],
          ['photos', `Photo queue · ${queue.length}`],
          ['reports', `Reports · ${reports.filter((r) => r.status === 'open').length}`]
        ] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-soft ${
              tab === key ? 'bg-sand text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: SELFIE VERIFICATION ── */}
      {tab === 'selfies' && (
        <div className="space-y-4">
          {/* Sub-filters */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {[
              ['pending', `Pending (${pendingSelfiesCount})`],
              ['all', `All Selfies (${realSelfies.length})`],
              ['approved', `Approved (${realSelfies.filter(s => s.selfieStatus === 'approved').length})`],
              ['rejected', `Rejected (${realSelfies.filter(s => s.selfieStatus === 'rejected').length})`],
            ].map(([fKey, fLabel]) => (
              <button
                key={fKey}
                onClick={() => setSelfieFilter(fKey as any)}
                className={`rounded-full px-3.5 py-1 text-[12px] font-medium border transition-colors ${
                  selfieFilter === fKey
                    ? 'border-berry-500 bg-berry-500 text-white'
                    : 'border-sand bg-cream-deep text-ink-soft hover:border-berry-300'
                }`}
              >
                {fLabel}
              </button>
            ))}
          </div>

          {filteredSelfies.length === 0 ? (
            <EmptyState
              icon={<ShieldCheckIcon className="h-6 w-6 text-berry-500" />}
              title="No selfies in this queue"
              body="Every submitted live selfie has been reviewed. Newly onboarded members will appear here automatically."
            />
          ) : (
            <ul className="space-y-6">
              {filteredSelfies.map((item) => {
                const isBusy = busySelfieId === item.userId;
                return (
                  <li
                    key={item.userId}
                    className="overflow-hidden rounded-3xl border border-sand bg-cream-deep p-6 shadow-card"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-display text-[18px] font-bold text-ink">
                            {item.name}, {item.age}
                          </h3>
                          <Badge
                            tone={
                              item.gender?.toLowerCase() === 'woman'
                                ? 'berry'
                                : item.gender?.toLowerCase() === 'man'
                                ? 'indigo'
                                : 'neutral'
                            }
                          >
                            {item.gender}
                          </Badge>
                          <Badge
                            tone={
                              item.selfieStatus === 'approved'
                                ? 'moss'
                                : item.selfieStatus === 'rejected'
                                ? 'red'
                                : 'amber'
                            }
                          >
                            {item.selfieStatus === 'approved'
                              ? 'Verified'
                              : item.selfieStatus === 'rejected'
                              ? 'Rejected'
                              : 'Pending Verification'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[12px] text-ink-muted">
                          {item.location || 'Location not set'} · Registered {relativeTime(item.createdAt)} · {item.email}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {item.selfieStatus === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleModerateSelfie(item.userId, 'approved')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              {isBusy ? (
                                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckIcon className="h-3.5 w-3.5" />
                              )}
                              Approve Selfie
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              disabled={isBusy}
                              onClick={() => handleModerateSelfie(item.userId, 'rejected')}
                            >
                              {isBusy ? (
                                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XIcon className="h-3.5 w-3.5" />
                              )}
                              Reject
                            </Button>
                          </>
                        ) : (
                          <>
                            {item.selfieStatus === 'approved' ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={isBusy}
                                onClick={() => handleModerateSelfie(item.userId, 'rejected')}
                                className="text-rose-600 hover:text-rose-700 text-xs"
                              >
                                {isBusy ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <XIcon className="h-3 w-3" />}
                                Revoke & Reject
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={isBusy}
                                onClick={() => handleModerateSelfie(item.userId, 'approved')}
                                className="text-emerald-600 hover:text-emerald-700 text-xs"
                              >
                                {isBusy ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <CheckIcon className="h-3 w-3" />}
                                Approve
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Comparison Body vs Reviewed Privacy Summary */}
                    {item.selfieStatus === 'pending' && item.verificationSelfie ? (
                      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
                        
                        {/* Left: Private Live Selfie */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-berry-500">
                            <CameraIcon className="h-3.5 w-3.5" />
                            Live Captured Selfie
                          </div>
                          <div className="relative aspect-square w-full max-w-[260px] overflow-hidden rounded-2xl border-2 border-berry-400/50 bg-black shadow-md">
                            <img
                              src={item.verificationSelfie}
                              alt={`${item.name} selfie`}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm border border-white/20">
                              Private · Admin view only
                            </span>
                          </div>
                        </div>

                        {/* Right: Public Uploaded Photos for Comparison */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-wider text-ink-muted">
                            <span>Public Profile Photos ({item.photos.length})</span>
                            <span className="text-[11px] font-normal normal-case text-ink-soft">
                              Compare facial features to verify identity
                            </span>
                          </div>

                          {item.photos.length === 0 ? (
                            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-sand bg-cream/30 text-[13px] text-ink-muted">
                              No public gallery photos uploaded yet.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {item.photos.map((photo, pIdx) => (
                                <div
                                  key={photo.id || pIdx}
                                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-sand bg-black/40"
                                >
                                  <img
                                    src={photo.url}
                                    alt={`Public photo ${pIdx + 1}`}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                  {photo.isPrimary && (
                                    <span className="absolute top-2 left-2 rounded-full bg-berry-500/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                                      Main
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Approved or Rejected - Photo is hidden, only user's name & status shown */
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand bg-cream/40 px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.selfieStatus === 'approved' ? (
                            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-emerald-700">
                              <CheckCircle2Icon className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>
                                Verification approved for <strong className="font-semibold text-ink">{item.name}</strong>. Selfie photo is hidden from admin display.
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-rose-700">
                              <XCircleIcon className="h-4 w-4 text-rose-600 shrink-0" />
                              <span>
                                Verification rejected for <strong className="font-semibold text-ink">{item.name}</strong>. Selfie photo is hidden from admin display.
                              </span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-ink-muted">
                          Photo privacy protected
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── TAB 2: PUBLIC PHOTOS QUEUE ── */}
      {tab === 'photos' && (
        queue.length === 0 ? (
          <EmptyState
            icon={<CheckIcon className="h-5 w-5" />}
            title="Photo queue is clear"
            body="Every uploaded photo has been reviewed. New uploads will appear here automatically."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {queue.map((photo) => {
              const ownerName = (photo as any).ownerName || 'Member';
              return (
                <li key={photo.id} className="overflow-hidden rounded-4xl bg-cream-deep shadow-card">
                  <img src={photo.url} alt="" className="aspect-[4/3] w-full object-cover" />
                  <div className="p-4">
                    <p className="font-medium text-ink">{ownerName}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      Uploaded {relativeTime(photo.uploadedAt)} · position {photo.order + 1}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        block
                        onClick={() => {
                          moderatePhoto(photo.id, 'approved');
                          setRealPhotos(prev => prev.filter(p => p.id !== photo.id));
                          toast.success('Photo approved');
                          window.dispatchEvent(new CustomEvent('admin-moderation-updated'));
                        }}
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        block
                        variant="danger"
                        onClick={() => {
                          moderatePhoto(photo.id, 'rejected');
                          setRealPhotos(prev => prev.filter(p => p.id !== photo.id));
                          toast.success('Photo removed');
                          window.dispatchEvent(new CustomEvent('admin-moderation-updated'));
                        }}
                      >
                        <XIcon className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}

      {/* ── TAB 3: REPORTS ── */}
      {tab === 'reports' && (
        reports.length === 0 ? (
          <EmptyState
            icon={<FlagIcon className="h-5 w-5" />}
            title="No reports"
            body="Reported profiles, photos and mingles appear here with the reporter kept anonymous."
          />
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => {
              const targetName = (report as any).targetName || db.users.find((u) => u.id === report.targetUserId)?.name || 'member';
              return (
                <li
                  key={report.id}
                  className="flex flex-wrap items-start gap-4 rounded-4xl bg-cream-deep p-5 shadow-card"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{report.reason}</p>
                      <Badge tone="neutral">{report.context}</Badge>
                      <Badge
                        tone={
                          report.status === 'open'
                            ? 'amber'
                            : report.status === 'resolved'
                            ? 'moss'
                            : 'neutral'
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-[13px] text-ink-soft">
                      Against <span className="font-medium text-ink">{targetName}</span>{' '}
                      · {relativeTime(report.createdAt)}
                    </p>
                    {report.detail && (
                      <p className="mt-2 rounded-2xl bg-cream px-3.5 py-2 text-[13px] leading-relaxed text-ink-soft">
                        {report.detail}
                      </p>
                    )}
                  </div>
                  {report.status === 'open' && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          resolveReport(report.id, 'dismissed');
                          setRealReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'dismissed' } : r));
                          toast.success('Report dismissed');
                          window.dispatchEvent(new CustomEvent('admin-moderation-updated'));
                        }}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setUserSuspended(report.targetUserId, true);
                          resolveReport(report.id, 'resolved');
                          setRealReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
                          toast.success('Member suspended and report resolved');
                          window.dispatchEvent(new CustomEvent('admin-moderation-updated'));
                        }}
                      >
                        Suspend member
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          resolveReport(report.id, 'resolved');
                          setRealReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
                          toast.success('Report resolved');
                          window.dispatchEvent(new CustomEvent('admin-moderation-updated'));
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
}
