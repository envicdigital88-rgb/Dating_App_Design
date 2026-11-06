import type { Package } from '@/lib/types';

/**
 * Legacy package details. Wingle prices come from the shared Wingits rules.
 */
export const seedPackages: Package[] = [
{
  id: 'pkg-free',
  name: 'Free',
  price: 0,
  durationDays: 0,
  chatLimit: null,
  wingleLimit: null,
  incomingWinglesUnlocked: false,
  priorityVisibility: false,
  tagline: 'Discover people and connect with Wingits.',
  features: [
  'Create your profile',
  'Upload up to 6 photos',
  'Browse every member',
  'Unlimited likes'],

  active: true
},
{
  id: 'pkg-basic',
  name: 'Basic',
  price: 14.99,
  durationDays: 30,
  chatLimit: null,
  wingleLimit: null,
  incomingWinglesUnlocked: true,
  priorityVisibility: false,
  tagline: 'Unlock who already wants to meet you.',
  features: [
  'See who sent you wingles',
  'Photo sharing in chat',
  'Read receipts'],

  active: true
},
{
  id: 'pkg-premium',
  name: 'Premium',
  price: 29.99,
  durationDays: 30,
  chatLimit: null,
  wingleLimit: null,
  incomingWinglesUnlocked: true,
  priorityVisibility: true,
  tagline: 'Get priority profile visibility.',
  features: [
  'See who sent you wingles',
  'Priority profile visibility',
  'Verified badge review',
  'Advanced privacy controls'],

  active: true
}];