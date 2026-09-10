'use client';

import { Navigate } from '@/components/Navigate';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, StarIcon, Trash2Icon, PlusIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Field';
import { PhotoUploader } from '@/components/PhotoUploader';
import { useStore } from '@/lib/contexts/StoreContext';
import { interestOptions, intentionOptions, lifestyleFields, traitOptions, promptAnswers } from '@/lib/data/interests';
import type { DatingIntention, Lifestyle, User, Prompt } from '@/lib/types';
import { id as makeId } from '@/lib/utils/format';

const steps = ['About you', 'Your words', 'Interests', 'Personality', 'Lifestyle', 'Vibe Prompts', 'Photos'];

export function Onboarding() {
  const router = useRouter();
  const { currentUser, completeOnboarding } = useStore();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const [age, setAge] = useState('');
  const [gender, setGender] = useState<User['gender']>('woman');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [intention, setIntention] = useState<DatingIntention>('Long-term relationship');
  const [interests, setInterests] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [work, setWork] = useState('');
  const [lifestyle, setLifestyle] = useState<Lifestyle>({
    drinking: 'Socially',
    smoking: 'Never',
    exercise: 'Sometimes',
    pets: 'None',
    children: 'None',
    education: 'Undergraduate',
    work: ''
  });
  const [prompts, setPrompts] = useState<Prompt[]>([
    { id: makeId('p'), question: 'What are your main hobbies?', answer: '' },
    { id: makeId('p'), question: 'What\'s your favorite movie or book?', answer: '' },
    { id: makeId('p'), question: 'A typical weekend for me looks like...', answer: '' },
    { id: makeId('p'), question: 'The most spontaneous thing I\'ve done recently is...', answer: '' }
  ]);
  const [photos, setPhotos] = useState<string[]>([]);

  if (!currentUser) return <Navigate to="/sign-up" replace />;
  if (currentUser.onboarded) return <Navigate to="/discover" replace />;

  const validate = () => {
    if (step === 0) {
      const numeric = Number(age);
      if (!numeric || numeric < 18 || numeric > 99) return 'Enter an age between 18 and 99.';
      if (!location.trim()) return 'Add the area you live in.';
    }
    if (step === 1 && bio.trim().length > 0 && bio.trim().length < 40) return 'Write at least 40 characters — it really helps.';
    if (step === 2 && interests.length < 3) return 'Pick at least three interests.';
    if (step === 3 && traits.length < 3) return 'Pick at least three personality traits to define your vibe.';
    if (step === 5) {
      const answered = prompts.filter(p => p.answer.trim().length > 0);
      if (answered.length === 0) return 'Please select an answer for at least one prompt.';
    }
    if (step === 6 && photos.length < 1) return 'Add at least one photo to continue.';
    return '';
  };

  const next = () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    completeOnboarding({
      age: Number(age),
      gender,
      location: location.trim(),
      bio: bio.trim(),
      intention,
      interests,
      traits,
      prompts: prompts.filter(p => p.answer.trim().length > 0),
      lifestyle: { ...lifestyle, work: work.trim() },
      photoUrls: photos
    });
    toast.success('Profile live — time to meet people');
    router.push('/discover');
  };

  const toggleInterest = (interest: string) =>
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((i) => i !== interest)
        : current.length >= 8
          ? current
          : [...current, interest]
    );

  const toggleTrait = (trait: string) =>
    setTraits((current) =>
      current.includes(trait)
        ? current.filter((t) => t !== trait)
        : current.length >= 5
          ? current
          : [...current, trait]
    );



  const updatePrompt = (id: string, field: 'question' | 'answer', value: string) => {
    setPrompts(p => p.map(prompt => prompt.id === id ? { ...prompt, [field]: value } : prompt));
  };

  return (
    <div className="min-h-full w-full bg-cream">
      <header className="border-b border-sand/60 px-5 py-4 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <BrandMark />
          <span className="text-[13px] text-ink-muted">
            Step {step + 1} of {steps.length}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
        <ol className="mb-8 flex gap-1.5" aria-label="Profile setup progress">
          {steps.map((label, i) => (
            <li key={label} className="flex-1">
              <span
                className={`block h-1 rounded-full transition-colors duration-200 ease-soft ${
                  i <= step ? 'bg-berry-500' : 'bg-sand'
                }`}
              />
              <span
                className={`mt-2 hidden text-[12px] sm:block ${
                  i === step ? 'font-medium text-ink' : 'text-ink-muted'
                }`}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        <div className="rounded-4xl bg-white p-6 shadow-card sm:p-9">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-[28px] leading-tight text-ink">
                  Hi {currentUser.name} — the basics first
                </h1>
                <p className="mt-2 text-[15px] text-ink-soft">
                  Only your first name, age and area are ever shown publicly.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min={18}
                    max={99}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="29"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as User['gender'])}
                  >
                    <option value="woman">Woman</option>
                    <option value="man">Man</option>
                    <option value="non-binary">Non-binary</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="location">Where do you live?</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hackney, London"
                />
              </div>
              <div>
                <Label htmlFor="work">What do you do?</Label>
                <Input
                  id="work"
                  value={work}
                  onChange={(e) => setWork(e.target.value)}
                  placeholder="Product designer"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-[28px] leading-tight text-ink">
                  Say something only you would say
                </h1>
                <p className="mt-2 text-[15px] text-ink-soft">
                  Specific beats clever. Mention what you do on a good Saturday.
                </p>
              </div>
              <div>
                <Label htmlFor="bio">Your bio <span className="text-ink-muted font-normal">(Optional)</span></Label>
                <Textarea
                  id="bio"
                  value={bio}
                  maxLength={400}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="I cook far too much food for one person, so bring an appetite…"
                  className="min-h-[150px]"
                />
                <p className="mt-1.5 text-[12px] text-ink-muted">{bio.length}/400</p>
              </div>
              <div>
                <Label htmlFor="intention">What are you here for?</Label>
                <Select
                  id="intention"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value as DatingIntention)}
                >
                  {intentionOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="font-display text-[28px] leading-tight text-ink">
                What fills your weekends?
              </h1>
              <p className="mt-2 text-[15px] text-ink-soft">
                Choose three to eight. These show on your profile and give people a way in.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {interestOptions.map((interest) => {
                  const active = interests.includes(interest);
                  return (
                    <li key={interest}>
                      <button
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[14px] transition-[background-color,border-color,color] duration-150 ease-soft ${
                          active
                            ? 'border-berry-500 bg-berry-500 text-white'
                            : 'border-sand bg-white text-ink-soft hover:border-berry-300'
                        }`}
                      >
                        {active && <CheckIcon className="h-3.5 w-3.5" />}
                        {interest}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-[13px] text-ink-muted">{interests.length} selected</p>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="font-display text-[28px] leading-tight text-ink">
                Define your vibe
              </h1>
              <p className="mt-2 text-[15px] text-ink-soft">
                Choose three to five traits. This helps our algorithm find people who truly match your energy.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {traitOptions.map((trait) => {
                  const active = traits.includes(trait);
                  return (
                    <li key={trait}>
                      <button
                        type="button"
                        onClick={() => toggleTrait(trait)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[14px] transition-[background-color,border-color,color] duration-150 ease-soft ${
                          active
                            ? 'border-berry-500 bg-berry-500 text-white'
                            : 'border-sand bg-white text-ink-soft hover:border-berry-300'
                        }`}
                      >
                        {active && <CheckIcon className="h-3.5 w-3.5" />}
                        {trait}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-[13px] text-ink-muted">{traits.length} selected</p>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="font-display text-[28px] leading-tight text-ink">
                A little lifestyle detail
              </h1>
              <p className="mt-2 text-[15px] text-ink-soft">
                The practical things people would rather know upfront.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {lifestyleFields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Select
                      id={field.key}
                      value={lifestyle[field.key as keyof Lifestyle]}
                      onChange={(e) =>
                        setLifestyle((l) => ({ ...l, [field.key]: e.target.value }))
                      }
                    >
                      {field.options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-[28px] leading-tight text-ink">
                  Vibe Prompts
                </h1>
                <p className="mt-2 text-[15px] text-ink-soft">
                  Answer at least one of these prompts to help people get to know you better.
                </p>
              </div>
              <div className="space-y-6">
                {prompts.map((prompt) => (
                  <div key={prompt.id} className="relative rounded-2xl border border-sand bg-sand/20 p-4">
                    <div className="mb-2">
                      <Label htmlFor={`prompt-a-${prompt.id}`} className="text-base font-semibold text-ink">
                        {prompt.question}
                      </Label>
                    </div>
                    <div>
                      <Select
                        id={`prompt-a-${prompt.id}`}
                        value={prompt.answer}
                        onChange={(e) => updatePrompt(prompt.id, 'answer', e.target.value)}
                        className="font-medium text-berry-600 bg-white"
                      >
                        <option value="" disabled>Select an answer...</option>
                        {promptAnswers[prompt.question]?.map((ans) => (
                          <option key={ans} value={ans}>{ans}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h1 className="font-display text-[28px] leading-tight text-ink">Add your photos</h1>
              <p className="mt-2 text-[15px] text-ink-soft">
                Your first photo is your main one. Photos are cropped, compressed and reviewed by
                moderation before they go live.
              </p>
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {photos.map((url, i) => (
                  <li key={url.slice(-24) + i} className="group relative overflow-hidden rounded-3xl">
                    <img
                      src={url}
                      alt={`Your photo ${i + 1}`}
                      className="aspect-[3/4] w-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink">
                        <StarIcon className="h-3 w-3 text-berry-500" fill="currentColor" />
                        Main
                      </span>
                    )}
                    <div className="absolute inset-x-2 bottom-2 flex gap-1.5">
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setPhotos((p) => [p[i], ...p.filter((_, index) => index !== i)])
                          }
                          className="flex-1 rounded-full bg-white/95 py-1.5 text-[11px] font-medium text-ink"
                        >
                          Make main
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Delete photo"
                        onClick={() => setPhotos((p) => p.filter((_, index) => index !== i))}
                        className="rounded-full bg-white/95 p-1.5 text-ink"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
                {photos.length < 6 && (
                  <li>
                    <PhotoUploader onPhotos={(urls) => setPhotos((p) => [...p, ...urls].slice(0, 6))} />
                  </li>
                )}
              </ul>
            </div>
          )}

          <FieldError>{error}</FieldError>

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={next} size="lg">
              {step === steps.length - 1 ? 'Publish my profile' : 'Continue'}
              {step < steps.length - 1 && <ArrowRightIcon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}