import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EyeIcon, ImageIcon, PencilIcon, SparklesIcon } from 'lucide-react';
import { Page, PageHeader } from '../components/AppShell';
import { PhotoGallery } from '../components/PhotoGallery';
import { Button } from '../components/ui/Button';
import { Badge, VerifiedMark } from '../components/ui/Bits';
import { Input, Label, Select, Textarea } from '../components/ui/Field';
import { UsageMeter } from '../components/UsageMeter';
import { useStore } from '../contexts/StoreContext';
import { interestOptions, intentionOptions, lifestyleFields } from '../data/interests';
import type { DatingIntention, Lifestyle } from '../types';

export function MyProfile() {
  const navigate = useNavigate();
  const { currentUser, photosOf, updateProfile, entitlements, likesReceived, sentRequests } =
  useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    location: currentUser?.location ?? '',
    bio: currentUser?.bio ?? '',
    intention: (currentUser?.intention ?? 'Long-term relationship') as DatingIntention,
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

  const save = () => {
    updateProfile({
      location: draft.location.trim(),
      bio: draft.bio.trim(),
      intention: draft.intention as DatingIntention,
      interests: draft.interests,
      lifestyle: draft.lifestyle
    });
    setEditing(false);
    toast.success('Profile updated');
  };

  return (
    <Page>
      <PageHeader
        title="My profile"
        body="This is what other members see. Keep it current — active, complete profiles get far more requests."
        action={
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/app/photos')}>
              <ImageIcon className="h-4 w-4" />
              Photos
            </Button>
            <Button onClick={() => setEditing((e) => !e)}>
              {editing ?
            <>
                  <EyeIcon className="h-4 w-4" />
                  Preview
                </> :

            <>
                  <PencilIcon className="h-4 w-4" />
                  Edit profile
                </>
            }
            </Button>
          </div>
        } />
      

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
                label="Chat messages remaining"
                used={entitlements.chatUsed}
                limit={entitlements.chatLimit}
                tone="plum" />
              
              <UsageMeter
                label="Requests remaining"
                used={entitlements.requestsUsed}
                limit={entitlements.requestLimit}
                tone="plum" />
              
            </div>
            <Button
              size="sm"
              block
              className="mt-5 bg-cream text-plum-500 hover:bg-white"
              onClick={() => navigate('/app/packages')}>
              
              {entitlements.subscriptionStatus === 'free' ? 'Upgrade package' : 'Manage package'}
            </Button>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            {[
            { label: 'Likes', value: likesReceived().length },
            { label: 'Requests sent', value: sentRequests().length },
            { label: 'Photos', value: photos.length }].
            map((stat) =>
            <div key={stat.label} className="rounded-3xl bg-white p-4 text-center shadow-card">
                <dd className="font-display text-2xl text-ink">{stat.value}</dd>
                <dt className="mt-0.5 text-[12px] text-ink-muted">{stat.label}</dt>
              </div>
            )}
          </dl>
        </div>

        <div>
          {editing ?
          <div className="space-y-5 rounded-4xl bg-white p-6 shadow-card">
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
                <Label htmlFor="my-intention">Dating intention</Label>
                <Select
                id="my-intention"
                value={draft.intention}
                onChange={(e) =>
                setDraft((d) => ({ ...d, intention: e.target.value as DatingIntention }))
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
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={save}>Save changes</Button>
              </div>
            </div> :

          <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[32px] leading-none text-ink">
                  {currentUser.name}, {currentUser.age}
                </h2>
                {currentUser.verified && <VerifiedMark className="mt-1" />}
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
                  className="rounded-full border border-sand bg-white px-3.5 py-1.5 text-[14px] text-ink-soft">
                  
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
    </Page>);

}