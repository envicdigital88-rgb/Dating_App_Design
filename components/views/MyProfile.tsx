'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EyeIcon, ImageIcon, PencilIcon, SparklesIcon, ShieldCheckIcon, LockIcon, CameraIcon, AlertCircleIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Button } from '@/components/ui/Button';
import { Badge, VerifiedMark } from '@/components/ui/Bits';
import { Input, Label, Select, Textarea } from '@/components/ui/Field';
import { UsageMeter } from '@/components/UsageMeter';
import { Modal } from '@/components/ui/Modal';
import { LiveSelfieCapture } from '@/components/LiveSelfieCapture';
import { useStore } from '@/lib/contexts/StoreContext';
import { interestOptions, intentionOptions, lifestyleFields } from '@/lib/data/interests';
import type { WinglingIntention, Lifestyle } from '@/lib/types';

export function MyProfile() {
  const router = useRouter();
  const { db, currentUser, photosOf, updateProfile, entitlements, likesReceived, sentWingles, userById, unblockUser, submitVerificationSelfie } =
  useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'blocked'>('profile');
  const [isVerifyingSelfie, setIsVerifyingSelfie] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [isSubmittingSelfie, setIsSubmittingSelfie] = useState(false);
  const [draft, setDraft] = useState({
    name: currentUser?.name ?? '',
    location: currentUser?.location ?? '',
    bio: currentUser?.bio ?? '',
    intention: (currentUser?.intention ?? 'Long-term relationship') as WinglingIntention,
    interests: currentUser?.interests ?? [],
    lifestyle: (currentUser?.lifestyle ?? {
      drinking: 'Socially',
      smoking: 'Never',
      exercise: 'Sometimes',
      pets: 'None',
      children: 'None',
      education: 'Undergraduate',
      work: ''
    }) as Lifestyle
  });

  if (!currentUser || !entitlements) return null;

  const photos = photosOf(currentUser.id);
  const blocked = db.blocks.filter((b) => b.blockerId === currentUser.id);

  const save = () => {
    updateProfile({
      name: draft.name.trim(),
      location: draft.location.trim(),
      bio: draft.bio.trim(),
      intention: draft.intention as WinglingIntention,
      interests: draft.interests,
      lifestyle: draft.lifestyle
    });
    setActiveTab('profile');
    toast.success('Profile updated');
  };

  const handleSaveSelfie = async () => {
    if (!capturedSelfie) {
      toast.error('Please capture a clear live selfie first.');
      return;
    }
    setIsSubmittingSelfie(true);
    try {
      const ok = await submitVerificationSelfie(capturedSelfie);
      if (ok) {
        toast.success('Selfie submitted! Your profile is pending review.');
        setIsVerifyingSelfie(false);
        setCapturedSelfie(null);
      } else {
        toast.error('Failed to submit verification selfie. Please try again.');
      }
    } catch (err) {
      toast.error('Something went wrong submitting selfie.');
    } finally {
      setIsSubmittingSelfie(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="My profile"
        body="This is what other members see. Keep it current — active, complete profiles get far more wingles."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push('/photos')}>
              <ImageIcon className="h-4 w-4" />
              Photos
            </Button>
            <Button variant="outline" onClick={() => setActiveTab(t => t === 'blocked' ? 'profile' : 'blocked')}>
              {activeTab === 'blocked' ? (
                <>
                  <EyeIcon className="h-4 w-4" />
                  Preview
                </>
              ) : (
                <>
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sand/30">
                    <svg className="h-2.5 w-2.5 text-ink" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </span>
                  Blocked
                </>
              )}
            </Button>
            <Button onClick={() => setActiveTab(t => t === 'edit' ? 'profile' : 'edit')}>
              {activeTab === 'edit' ? (
                <>
                  <EyeIcon className="h-4 w-4" />
                  Preview
                </>
              ) : (
                <>
                  <PencilIcon className="h-4 w-4" />
                  Edit profile
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* ── Pending Verification: Private Profile / Under Review Banner ── */}
      {currentUser.selfieStatus === 'pending' && (
        <div className="mb-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500">
              <LockIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold text-ink">
                  Private Profile · Pending Admin Approval
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Under Review
                </span>
              </div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                Your profile is currently private and hidden from Discover while our admin team reviews your selfie verification. Once approved, your profile will be published with an official <strong>Photo Verified</strong> badge!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Rejected Selfie Banner ── */}
      {currentUser.selfieStatus === 'rejected' && (
        <div className="mb-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-500">
              <AlertCircleIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold text-rose-600 dark:text-rose-400">
                  Verification Not Approved · Retake Selfie
                </h3>
              </div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                Your selfie verification was not approved. Please retake a clear live selfie facing the camera in good lighting to get your profile published and verified.
              </p>
              <div className="mt-3">
                <Button size="sm" onClick={() => { setCapturedSelfie(null); setIsVerifyingSelfie(true); }}>
                  <CameraIcon className="h-4 w-4" />
                  Retake Live Selfie
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Existing Users Verification Announcement Banner (DO NOT show for Unlimited accounts) ── */}
      {!currentUser.isUnlimited && !currentUser.selfieStatus && (
        <div className="mb-6 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent p-5 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-500">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    New Feature
                  </span>
                  <h3 className="font-display text-base font-semibold text-ink">
                    Get Photo Verified
                  </h3>
                </div>
                <p className="mt-1 text-[13px] text-ink-soft leading-relaxed max-w-xl">
                  Take a quick live selfie with your front camera to verify your identity. Verified profiles stand out on Discover with an official Photo Verified badge!
                </p>
              </div>
            </div>
            <Button
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              onClick={() => { setCapturedSelfie(null); setIsVerifyingSelfie(true); }}
            >
              <CameraIcon className="h-4 w-4" />
              Verify Photo Now
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <PhotoGallery photos={photos} name={currentUser.name} />
          <div className="rounded-4xl bg-plum-500 p-5 text-cream">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg">{entitlements.packageName} package</p>
              <SparklesIcon className="h-4 w-4 text-cream/70" />
            </div>
            <div className="space-y-4">
              <UsageMeter
                label="Chat mingles remaining"
                used={entitlements.chatUsed}
                limit={entitlements.chatLimit}
                tone="plum" />
              
              <UsageMeter
                label="Wingles remaining"
                used={entitlements.winglesUsed}
                limit={entitlements.wingleLimit}
                tone="plum" />
              
            </div>
            <Button
              variant="inverse"
              size="sm"
              block
              className="mt-5"
              onClick={() => router.push('/packages')}>
              
              {entitlements.subscriptionStatus === 'free' ? 'Upgrade package' : 'Manage package'}
            </Button>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            {[
            { label: 'Likes', value: likesReceived().length },
            { label: 'Wingles sent', value: sentWingles().length },
            { label: 'Photos', value: photos.length }].
            map((stat) =>
            <div key={stat.label} className="rounded-3xl bg-cream-deep p-4 text-center shadow-card">
                <dd className="font-display text-2xl text-ink">{stat.value}</dd>
                <dt className="mt-0.5 text-[12px] text-ink-muted">{stat.label}</dt>
              </div>
            )}
          </dl>
        </div>

        <div>
          {activeTab === 'edit' ?
          <div className="space-y-5 rounded-4xl bg-cream-deep p-6 shadow-card">
              <div>
                <Label htmlFor="my-name">Name</Label>
                <Input
                id="my-name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="my-location">Location</Label>
                <Input
                id="my-location"
                value={draft.location}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} />
              
              </div>
              <div>
                <Label htmlFor="my-bio">Bio</Label>
                <Textarea
                id="my-bio"
                value={draft.bio}
                maxLength={400}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))} />
              
                <p className="mt-1.5 text-[12px] text-ink-muted">{draft.bio.length}/400</p>
              </div>
              <div>
                <Label htmlFor="my-intention">Wingling intention</Label>
                <Select
                id="my-intention"
                value={draft.intention}
                onChange={(e) =>
                setDraft((d) => ({ ...d, intention: e.target.value as WinglingIntention }))
                }>
                
                  {intentionOptions.map((option) =>
                <option key={option}>{option}</option>
                )}
                </Select>
              </div>
              <div>
                <Label>Interests</Label>
                <ul className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => {
                  const active = draft.interests.includes(interest);
                  return (
                    <li key={interest}>
                        <button
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          interests: active ?
                          d.interests.filter((i) => i !== interest) :
                          d.interests.length >= 8 ?
                          d.interests :
                          [...d.interests, interest]
                        }))
                        }
                        className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-[background-color,border-color,color] duration-150 ease-soft ${
                        active ?
                        'border-berry-500 bg-berry-500 text-white' :
                        'border-sand text-ink-soft hover:border-berry-300'}`
                        }>
                        
                          {interest}
                        </button>
                      </li>);

                })}
                </ul>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="my-work">Work</Label>
                  <Input
                  id="my-work"
                  value={draft.lifestyle.work}
                  onChange={(e) =>
                  setDraft((d) => ({ ...d, lifestyle: { ...d.lifestyle, work: e.target.value } }))
                  } />
                
                </div>
                {lifestyleFields.map((field) =>
              <div key={field.key}>
                    <Label htmlFor={`my-${field.key}`}>{field.label}</Label>
                    <Select
                  id={`my-${field.key}`}
                  value={draft.lifestyle[field.key as keyof Lifestyle]}
                  onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    lifestyle: { ...d.lifestyle, [field.key]: e.target.value }
                  }))
                  }>
                  
                      {field.options.map((option) =>
                  <option key={option}>{option}</option>
                  )}
                    </Select>
                  </div>
              )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setActiveTab('profile')}>
                  Cancel
                </Button>
                <Button onClick={save}>Save changes</Button>
              </div>
            </div> : activeTab === 'blocked' ?
            <div className="space-y-4">
              <h2 className="font-display text-[24px] text-ink mb-4">Blocked members</h2>
              {blocked.length === 0 ? (
                <p className="text-[14px] text-ink-muted">You haven't blocked anyone.</p>
              ) : (
                <ul className="space-y-3">
                  {blocked.map((b) => {
                    const u = userById(b.blockedUserId);
                    if (!u) return null;
                    return (
                      <li key={b.id} className="flex items-center justify-between rounded-3xl bg-cream-deep p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-ink">{u.name}</span>
                          <span className="text-[12px] text-ink-muted">{u.location}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => unblockUser(u.id)}>
                          Unblock
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div> :

          <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-[32px] leading-none text-ink">
                  {currentUser.name}, {currentUser.age}
                </h2>
                {currentUser.verified && <VerifiedMark className="mt-1" />}
                {(currentUser.selfieStatus === 'approved' || currentUser.isUnlimited) && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 border border-blue-500/20">
                    <ShieldCheckIcon className="h-3.5 w-3.5 text-blue-600" />
                    Photo Verified
                  </span>
                )}
              </div>
              <p className="mt-2 text-[14px] text-ink-soft">{currentUser.location}</p>

              <p className="mt-5">
                <Badge tone="berry">{currentUser.intention}</Badge>
              </p>

              <section className="mt-7">
                <h3 className="font-display text-xl text-ink">Your bio</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{currentUser.bio}</p>
              </section>

              <section className="mt-7">
                <h3 className="font-display text-xl text-ink">Interests</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {currentUser.interests.map((interest) =>
                <li
                  key={interest}
                  className="rounded-full border border-sand bg-cream-deep px-3.5 py-1.5 text-[14px] text-ink-soft">
                  
                      {interest}
                    </li>
                )}
                </ul>
              </section>

              <section className="mt-7">
                <h3 className="font-display text-xl text-ink">Lifestyle</h3>
                <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
                  <div className="flex justify-between gap-4 border-b border-sand py-2 text-[14px]">
                    <dt className="text-ink-muted">Work</dt>
                    <dd className="text-right font-medium text-ink">{currentUser.lifestyle.work}</dd>
                  </div>
                  {lifestyleFields.map((field) =>
                <div
                  key={field.key}
                  className="flex justify-between gap-4 border-b border-sand py-2 text-[14px]">
                  
                      <dt className="text-ink-muted">{field.label}</dt>
                      <dd className="text-right font-medium text-ink">
                        {currentUser.lifestyle[field.key as keyof Lifestyle]}
                      </dd>
                    </div>
                )}
                </dl>
              </section>
            </div>
          }
        </div>
      </div>

      {/* ── Live Selfie Verification Modal ── */}
      <Modal
        open={isVerifyingSelfie}
        onClose={() => {
          if (!isSubmittingSelfie) {
            setIsVerifyingSelfie(false);
            setCapturedSelfie(null);
          }
        }}
        title="Live Photo Verification"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-ink-soft">
            To ensure genuine members and build trust across WingleMingle, take a quick live selfie with your front camera. This selfie is private for moderation review only and will not appear on your public photo gallery.
          </p>

          <div className="py-2">
            <LiveSelfieCapture
              value={capturedSelfie}
              onChange={(val) => setCapturedSelfie(val)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              disabled={isSubmittingSelfie}
              onClick={() => {
                setIsVerifyingSelfie(false);
                setCapturedSelfie(null);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!capturedSelfie || isSubmittingSelfie}
              onClick={handleSaveSelfie}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmittingSelfie ? 'Submitting...' : 'Submit Verification'}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>);

}
