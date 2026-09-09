import type { Package } from '@/lib/types';

/**
 * Seed values only — packages live in the store and are editable from the
 * admin dashboard. Nothing in the product reads limits from anywhere else.
 */
export const seedPackages: Package[] = [
{
  id: 'pkg-free',
  name: 'Free',
  price: 0,
  durationDays: 0,
  chatLimit: 5,
  requestLimit: 3,
  incomingRequestsUnlocked: false,
  priorityVisibility: false,
  tagline: 'See who is out there and start a few conversations.',
  features: [
  'Create your profile',
  'Upload up to 6 photos',
  'Browse every member',
  'Unlimited likes',
  '3 dating requests',
  '5 chat messages'],

  active: true
},
{
  id: 'pkg-basic',
  name: 'Basic',
  price: 14.99,
  durationDays: 30,
  chatLimit: 120,
  requestLimit: 25,
  incomingRequestsUnlocked: true,
  priorityVisibility: false,
  tagline: 'Unlock who already wants to meet you.',
  features: [
  'See who sent you requests',
  '25 dating requests a month',
  '120 chat messages',
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
  requestLimit: 100,
  incomingRequestsUnlocked: true,
  priorityVisibility: true,
  tagline: 'Talk freely and be seen first.',
  features: [
  'Unlimited chat messages',
  '100 dating requests a month',
  'See who sent you requests',
  'Priority profile visibility',
  'Verified badge review',
  'Advanced privacy controls'],

  active: true
}];