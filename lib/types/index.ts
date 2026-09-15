export type Gender = 'woman' | 'man' | 'non-binary';

export type WinglingIntention =
'Long-term relationship' |
'Long-term, open to short' |
'Something casual' |
'New friends first';

export type ModerationState = 'approved' | 'pending' | 'rejected';

export interface Photo {
  id: string;
  userId: string;
  url: string;
  order: number;
  isPrimary: boolean;
  moderation: ModerationState;
  uploadedAt: string;
}

export interface Lifestyle {
  drinking: string;
  smoking: string;
  exercise: string;
  pets: string;
  children: string;
  education: string;
  work: string;
}

export interface Prompt {
  id: string;
  question: string;
  answer: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'member' | 'admin';
  age: number;
  gender: Gender;
  location: string;
  bio: string;
  intention: WinglingIntention;
  interests: string[];
  traits: string[];
  prompts: Prompt[];
  lifestyle: Lifestyle;
  verified: boolean;
  suspended: boolean;
  onboarded: boolean;
  online: boolean;
  lastActiveAt: string;
  createdAt: string;
  isAnonymous?: boolean;
  anonymousName?: string;
}

export interface UserStatus {
  id: string;
  userId: string;
  photoUrl: string;
  createdAt: string;
  expiresAt: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  /** null means unlimited */
  chatLimit: number | null;
  wingleLimit: number | null;
  incomingWinglesUnlocked: boolean;
  priorityVisibility: boolean;
  features: string[];
  active: boolean;
  tagline: string;
}

export interface Subscription {
  id: string;
  userId: string;
  packageId: string;
  status: 'active' | 'expired' | 'cancelled';
  startedAt: string;
  expiresAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  packageId: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'refunded';
  method: string;
  reference: string;
  createdAt: string;
}

export interface Usage {
  userId: string;
  chatUsed: number;
  winglesUsed: number;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  viewed?: boolean;
}

export interface WinglingWingle {
  id: string;
  fromUserId: string;
  toUserId: string;
  note: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
  viewed?: boolean;
}

export interface Connection {
  id: string;
  userIds: [string, string];
  createdAt: string;
}

export interface Mingle {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  imageUrl?: string;
  createdAt: string;
  readAt: string | null;
  deleted: boolean;
}

export interface Conversation {
  id: string;
  userIds: [string, string];
  createdAt: string;
  lastMingleAt: string;
}

export type NotificationType =
'wingle_received' |
'wingle_accepted' |
'mingle' |
'connection' |
'like' |
'package_activated' |
'chat_limit_warning' |
'chat_limit_reached' |
'payment_success' |
'subscription_expiring';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetUserId: string;
  reason: string;
  detail: string;
  context: 'profile' | 'chat' | 'photo';
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: string;
}

export interface Entitlements {
  packageId: string;
  packageName: string;
  chatLimit: number | null;
  chatUsed: number;
  chatRemaining: number | null;
  wingleLimit: number | null;
  winglesUsed: number;
  winglesRemaining: number | null;
  incomingWinglesUnlocked: boolean;
  priorityVisibility: boolean;
  subscriptionStatus: 'free' | 'active' | 'expired';
  subscriptionExpiry: string | null;
}

export type ServerResult<T = void> =
{ok: true;data: T;} |
{ok: false;error: string;reason?: 'chat_limit' | 'wingle_limit' | 'locked' | 'invalid';};