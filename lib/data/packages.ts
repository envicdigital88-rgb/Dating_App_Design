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
  wingleLimit: 3,
  incomingWinglesUnlocked: false,
  priorityVisibility: false,
  tagline: 'See who is out there and start a few conversations.',
  features: [
  'Create your profile',
  'Upload up to 6 photos',
  'Browse every member',
  'Unlimited likes',
  '3 wingling wingles',
  '5 chat mingles'],

  active: true
},
{
  id: 'pkg-basic',
  name: 'Basic',
  price: 14.99,
  durationDays: 30,
  chatLimit: 120,
  wingleLimit: 25,
  incomingWinglesUnlocked: true,
  priorityVisibility: false,
  tagline: 'Unlock who already wants to meet you.',
  features: [
  'See who sent you wingles',
  '25 wingling wingles a month',
  '120 chat mingles',
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
  wingleLimit: 100,
  incomingWinglesUnlocked: true,
  priorityVisibility: true,
  tagline: 'Talk freely and be seen first.',
  features: [
  'Unlimited chat mingles',
  '100 wingling wingles a month',
  'See who sent you wingles',
  'Priority profile visibility',
  'Verified badge review',
  'Advanced privacy controls'],

  active: true
}];