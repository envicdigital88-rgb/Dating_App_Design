'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type {
  AppNotification,
  Block,
  Connection,
  Conversation,
  WinglingWingle,
  Entitlements,
  Like,
  Mingle,
  Package,
  Payment,
  Photo,
  Report,
  ServerResult,
  Subscription,
  Usage,
  User,
  UserStatus,
  Prompt } from
'@/lib/types';
import { seedPackages } from '@/lib/data/packages';
import {
  ADMIN_USER_ID,
  DEMO_USER_ID,
  seedConnections,
  seedConversations,
  seedLikes,
  seedMingles,
  seedNotifications,
  seedPayments,
  seedPhotos,
  seedReports,
  seedWingles,
  seedStatuses,
  seedUsers } from
'@/lib/data/seed';
import { id as makeId } from '@/lib/utils/format';

/**
 * Simulated server. Every limit, package rule and payment verification is
 * enforced in here against stored records — never from component state.
 */
interface Db {
  users: User[];
  photos: Photo[];
  packages: Package[];
  subscriptions: Subscription[];
  payments: Payment[];
  usage: Usage[];
  likes: Like[];
  passes: {userId: string;targetUserId: string;}[];
  heartBucket: {userId: string;targetUserId: string;}[];
  wingles: WinglingWingle[];
  connections: Connection[];
  conversations: Conversation[];
  mingles: Mingle[];
  notifications: AppNotification[];
  reports: Report[];
  blocks: Block[];
  statuses: UserStatus[];
}

const initialDb: Db = {
  users: seedUsers,
  photos: seedPhotos,
  packages: seedPackages,
  subscriptions: [],
  payments: seedPayments,
  usage: [{ userId: DEMO_USER_ID, chatUsed: 2, winglesUsed: 3 }],
  likes: seedLikes,
  passes: [],
  heartBucket: [],
  wingles: seedWingles,
  connections: seedConnections,
  conversations: seedConversations,
  mingles: seedMingles,
  notifications: seedNotifications,
  reports: seedReports,
  blocks: [],
  statuses: seedStatuses
};

interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface OnboardingInput {
  age: number;
  gender: User['gender'];
  location: string;
  bio: string;
  intention: User['intention'];
  interests: string[];
  traits: string[];
  prompts: Prompt[];
  lifestyle: User['lifestyle'];
  photoUrls: string[];
}

interface StoreValue {
  db: Db;
  currentUser: User | null;
  entitlements: Entitlements | null;
  freePackage: Package;
  // auth
  login: (email: string, password: string) => ServerResult<User>;
  register: (input: RegisterInput) => ServerResult<User>;
  logout: () => void;
  completeOnboarding: (input: OnboardingInput) => void;
  updateProfile: (patch: Partial<User>) => void;
  deleteAccount: () => void;
  // photos
  photosOf: (userId: string) => Photo[];
  addPhoto: (url: string) => void;
  deletePhoto: (photoId: string) => void;
  setPrimaryPhoto: (photoId: string) => void;
  movePhoto: (photoId: string, direction: -1 | 1) => void;
  // discovery
  discoverFeed: () => User[];
  userById: (userId: string) => User | undefined;
  likeUser: (userId: string) => void;
  passUser: (userId: string) => void;
  hasLiked: (userId: string) => boolean;
  likesReceived: () => Like[];
  heartBucketOf: () => User[];
  addToHeartBucket: (userId: string) => void;
  removeFromHeartBucket: (userId: string) => void;
  // wingles
  sendWingle: (toUserId: string, note: string) => ServerResult<WinglingWingle>;
  respondToWingle: (wingleId: string, status: 'accepted' | 'declined') => void;
  sentWingles: () => WinglingWingle[];
  incomingWingles: () => WinglingWingle[];
  wingleStatusWith: (userId: string) => WinglingWingle | undefined;
  // chat
  conversationsOf: () => Conversation[];
  conversationWith: (userId: string) => Conversation | undefined;
  ensureConversation: (userId: string) => Conversation;
  minglesOf: (conversationId: string) => Mingle[];
  sendMingle: (conversationId: string, body: string, imageUrl?: string) => ServerResult<Mingle>;
  markConversationRead: (conversationId: string) => void;
  deleteMingle: (mingleId: string) => void;
  typingIn: string | null;
  activePopupChatId: string | null;
  openChatPopup: (conversationId: string) => void;
  closeChatPopup: () => void;
  // safety
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
  reportUser: (userId: string, reason: string, detail: string, context: Report['context']) => void;
  // payments
  purchasePackage: (
  packageId: string,
  card: {number: string;name: string;})
  => Promise<ServerResult<Payment>>;
  activeSubscription: () => Subscription | undefined;
  paymentsOf: (userId: string) => Payment[];
  // notifications
  notificationsOf: () => AppNotification[];
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  // admin
  savePackage: (pkg: Package) => void;
  deletePackage: (packageId: string) => void;
  setUserSuspended: (userId: string, suspended: boolean) => void;
  setUserVerified: (userId: string, verified: boolean) => void;
  removeUser: (userId: string) => void;
  moderatePhoto: (photoId: string, state: Photo['moderation']) => void;
  resolveReport: (reportId: string, status: Report['status']) => void;
  refundPayment: (paymentId: string) => void;
  // statuses
  statusesOf: (userId: string) => UserStatus[];
  myStatuses: () => UserStatus[];
  addStatus: (photoUrl: string) => void;
  deleteStatus: (statusId: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: {children: React.ReactNode;}) {
  const [db, setDb] = useState<Db>(initialDb);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [typingIn] = useState<string | null>(null);
  const [activePopupChatId, setActivePopupChatId] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = sessionId;
  const peerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedSession = localStorage.getItem('winglemingle_session');
        if (storedSession) {
          setSessionId(storedSession);
        }

        const stored = localStorage.getItem('winglemingle_mingles');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setDb(d => ({ ...d, mingles: parsed }));
          }
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionId) {
        localStorage.setItem('winglemingle_session', sessionId);
      } else {
        localStorage.removeItem('winglemingle_session');
      }
    }
  }, [sessionId]);

  useEffect(() => {
    if (db.mingles !== initialDb.mingles && typeof window !== 'undefined') {
      localStorage.setItem('winglemingle_mingles', JSON.stringify(db.mingles));
    }
  }, [db.mingles]);

  useEffect(() => {
    if (!sessionId) return;
    
    let peer: any;
    import('peerjs').then(({ default: Peer }) => {
      peer = new Peer(sessionId);
      peerRef.current = peer;

      peer.on('connection', (conn: any) => {
        conn.on('data', (data: any) => {
          if (data.type === 'mingle') {
            const mingle = data.mingle;
            setDb((d) => {
              if (d.mingles.find(m => m.id === mingle.id)) return d;
              return {
                ...d,
                mingles: [...d.mingles, mingle],
                conversations: d.conversations.map((c) =>
                  c.id === mingle.conversationId ? { ...c, lastMingleAt: mingle.createdAt } : c
                )
              };
            });
          }
        });
      });
    });

    return () => {
      if (peer) {
        peer.destroy();
        peerRef.current = null;
      }
    };
  }, [sessionId]);

  const currentUser = useMemo(
    () => db.users.find((u) => u.id === sessionId) ?? null,
    [db.users, sessionId]
  );

  const freePackage = useMemo(
    () => db.packages.find((p) => p.price === 0) ?? seedPackages[0],
    [db.packages]
  );

  const activeSubscription = useCallback(() => {
    if (!sessionId) return undefined;
    return db.subscriptions.find(
      (s) => s.userId === sessionId && s.status === 'active' && new Date(s.expiresAt) > new Date()
    );
  }, [db.subscriptions, sessionId]);

  const entitlements = useMemo<Entitlements | null>(() => {
    if (!currentUser) return null;
    const sub = db.subscriptions.find(
      (s) =>
      s.userId === currentUser.id && s.status === 'active' && new Date(s.expiresAt) > new Date()
    );
    const pkg = sub ? db.packages.find((p) => p.id === sub.packageId) ?? freePackage : freePackage;
    const usage =
    db.usage.find((u) => u.userId === currentUser.id) ??
    { userId: currentUser.id, chatUsed: 0, winglesUsed: 0 } as Usage;
    return {
      packageId: pkg.id,
      packageName: pkg.name,
      chatLimit: pkg.chatLimit,
      chatUsed: usage.chatUsed,
      chatRemaining: pkg.chatLimit === null ? null : Math.max(0, pkg.chatLimit - usage.chatUsed),
      wingleLimit: pkg.wingleLimit,
      winglesUsed: usage.winglesUsed,
      winglesRemaining:
      pkg.wingleLimit === null ? null : Math.max(0, pkg.wingleLimit - usage.winglesUsed),
      incomingWinglesUnlocked: pkg.incomingWinglesUnlocked,
      priorityVisibility: pkg.priorityVisibility,
      subscriptionStatus: sub ? 'active' : 'free',
      subscriptionExpiry: sub?.expiresAt ?? null
    };
  }, [currentUser, db.packages, db.subscriptions, db.usage, freePackage]);

  const notify = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setDb((d) => ({
      ...d,
      notifications: [
      { ...n, id: makeId('nt'), createdAt: new Date().toISOString(), read: false },
      ...d.notifications]

    }));
  }, []);

  /* ---------------------------------------------------------------- auth */

  const login = useCallback<StoreValue['login']>(
    (email, password) => {
      const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user || user.password !== password)
      return { ok: false, error: 'That email and password combination does not match an account.' };
      if (user.suspended) return { ok: false, error: 'This account is suspended. Contact support.' };
      setSessionId(user.id);
      return { ok: true, data: user };
    },
    [db.users]
  );

  const register = useCallback<StoreValue['register']>(
    ({ name, email, phone, password }) => {
      if (!name.trim() || !email.trim() || !password) return { ok: false, error: 'Fill every field to continue.' };
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'Enter a valid email address.' };
      if (password.length < 8) return { ok: false, error: 'Passwords need at least 8 characters.' };
      if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase()))
      return { ok: false, error: 'An account already exists with that email.' };
      const user: User = {
        id: makeId('u'),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: 'member',
        age: 0,
        gender: 'woman',
        location: '',
        bio: '',
        intention: 'Long-term relationship',
        interests: [],
        traits: [],
        prompts: [],
        lifestyle: {
          drinking: 'Socially',
          smoking: 'Never',
          exercise: 'Sometimes',
          pets: 'None',
          children: 'None',
          education: 'Undergraduate',
          work: ''
        },
        verified: false,
        suspended: false,
        onboarded: false,
        online: true,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      setDb((d) => ({
        ...d,
        users: [...d.users, user],
        usage: [...d.usage, { userId: user.id, chatUsed: 0, winglesUsed: 0 }]
      }));
      setSessionId(user.id);
      return { ok: true, data: user };
    },
    [db.users]
  );

  const logout = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setSessionId(null);
  }, []);

  const completeOnboarding = useCallback<StoreValue['completeOnboarding']>((input) => {
    setDb((d) => {
      if (!d.users.some((u) => u.id === sessionIdRef.current)) return d;
      const uid = sessionIdRef.current as string;
      const newPhotos: Photo[] = input.photoUrls.map((url, i) => ({
        id: makeId('ph'),
        userId: uid,
        url,
        order: i,
        isPrimary: i === 0,
        moderation: 'approved',
        uploadedAt: new Date().toISOString()
      }));
      return {
        ...d,
        users: d.users.map((u) =>
        u.id === uid ?
        {
          ...u,
          age: input.age,
          gender: input.gender,
          location: input.location,
          bio: input.bio,
          intention: input.intention,
          interests: input.interests,
          traits: input.traits,
          prompts: input.prompts,
          lifestyle: input.lifestyle,
          onboarded: true
        } :
        u
        ),
        photos: [...d.photos.filter((p) => p.userId !== uid), ...newPhotos]
      };
    });
  }, []);

  const updateProfile = useCallback<StoreValue['updateProfile']>((patch) => {
    setDb((d) => ({
      ...d,
      users: d.users.map((u) => u.id === sessionIdRef.current ? { ...u, ...patch } : u)
    }));
  }, []);

  const deleteAccount = useCallback(() => {
    const uid = sessionIdRef.current;
    setSessionId(null);
    setDb((d) => ({
      ...d,
      users: d.users.filter((u) => u.id !== uid),
      photos: d.photos.filter((p) => p.userId !== uid)
    }));
  }, []);

  /* -------------------------------------------------------------- photos */

  const photosOf = useCallback<StoreValue['photosOf']>(
    (userId) =>
    db.photos.
    filter((p) => p.userId === userId && p.moderation !== 'rejected').
    sort((a, b) => a.order - b.order),
    [db.photos]
  );

  const addPhoto = useCallback<StoreValue['addPhoto']>((url) => {
    setDb((d) => {
      const uid = sessionIdRef.current as string;
      const mine = d.photos.filter((p) => p.userId === uid);
      return {
        ...d,
        photos: [
        ...d.photos,
        {
          id: makeId('ph'),
          userId: uid,
          url,
          order: mine.length,
          isPrimary: mine.length === 0,
          moderation: 'pending',
          uploadedAt: new Date().toISOString()
        }]

      };
    });
  }, []);

  const deletePhoto = useCallback<StoreValue['deletePhoto']>((photoId) => {
    setDb((d) => {
      const target = d.photos.find((p) => p.id === photoId);
      if (!target) return d;
      const mine = d.photos.
      filter((p) => p.userId === target.userId && p.id !== photoId).
      sort((a, b) => a.order - b.order).
      map((p, i) => ({ ...p, order: i, isPrimary: target.isPrimary ? i === 0 : p.isPrimary }));
      return { ...d, photos: [...d.photos.filter((p) => p.userId !== target.userId), ...mine] };
    });
  }, []);

  const setPrimaryPhoto = useCallback<StoreValue['setPrimaryPhoto']>((photoId) => {
    setDb((d) => {
      const target = d.photos.find((p) => p.id === photoId);
      if (!target) return d;
      return {
        ...d,
        photos: d.photos.map((p) =>
        p.userId === target.userId ? { ...p, isPrimary: p.id === photoId } : p
        )
      };
    });
  }, []);

  const movePhoto = useCallback<StoreValue['movePhoto']>((photoId, direction) => {
    setDb((d) => {
      const target = d.photos.find((p) => p.id === photoId);
      if (!target) return d;
      const mine = d.photos.
      filter((p) => p.userId === target.userId).
      sort((a, b) => a.order - b.order);
      const index = mine.findIndex((p) => p.id === photoId);
      const swapWith = index + direction;
      if (swapWith < 0 || swapWith >= mine.length) return d;
      const reordered = [...mine];
      [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
      const orderMap = new Map(reordered.map((p, i) => [p.id, i]));
      return {
        ...d,
        photos: d.photos.map((p) => orderMap.has(p.id) ? { ...p, order: orderMap.get(p.id) as number } : p)
      };
    });
  }, []);

  /* ----------------------------------------------------------- discovery */

  const userById = useCallback<StoreValue['userById']>(
    (userId) => db.users.find((u) => u.id === userId),
    [db.users]
  );

  const discoverFeed = useCallback<StoreValue['discoverFeed']>(() => {
    if (!sessionId) return [];
    const blocked = new Set(
      db.blocks.filter((b) => b.blockerId === sessionId).map((b) => b.blockedUserId)
    );
    const passed = new Set(
      db.passes.filter((p) => p.userId === sessionId).map((p) => p.targetUserId)
    );
    const premiumIds = new Set(
      db.subscriptions.
      filter((s) => s.status === 'active').
      filter((s) => db.packages.find((p) => p.id === s.packageId)?.priorityVisibility).
      map((s) => s.userId)
    );
    return db.users.
    filter(
      (u) =>
      u.id !== sessionId &&
      u.role === 'member' &&
      u.onboarded &&
      !u.suspended &&
      !blocked.has(u.id) &&
      !passed.has(u.id)
    ).
    sort((a, b) => {
      const pa = premiumIds.has(a.id) ? 1 : 0;
      const pb = premiumIds.has(b.id) ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    });
  }, [db.blocks, db.packages, db.passes, db.subscriptions, db.users, sessionId]);

  const likeUser = useCallback<StoreValue['likeUser']>((userId) => {
    setDb((d) => {
      const uid = sessionIdRef.current as string;
      if (d.likes.some((l) => l.fromUserId === uid && l.toUserId === userId)) return d;
      return {
        ...d,
        likes: [
        ...d.likes,
        { id: makeId('lk'), fromUserId: uid, toUserId: userId, createdAt: new Date().toISOString() }]

      };
    });
  }, []);

  const passUser = useCallback<StoreValue['passUser']>((userId) => {
    setDb((d) => ({
      ...d,
      passes: [...d.passes, { userId: sessionIdRef.current as string, targetUserId: userId }]
    }));
  }, []);

  const hasLiked = useCallback<StoreValue['hasLiked']>(
    (userId) => db.likes.some((l) => l.fromUserId === sessionId && l.toUserId === userId),
    [db.likes, sessionId]
  );

  const likesReceived = useCallback<StoreValue['likesReceived']>(
    () => db.likes.filter((l) => l.toUserId === sessionId),
    [db.likes, sessionId]
  );

  const heartBucketOf = useCallback<StoreValue['heartBucketOf']>(() => {
    if (!sessionId) return [];
    const heartTargetIds = new Set(
      db.heartBucket.filter((h) => h.userId === sessionId).map((h) => h.targetUserId)
    );
    return db.users.filter((u) => heartTargetIds.has(u.id));
  }, [db.heartBucket, db.users, sessionId]);

  const addToHeartBucket = useCallback<StoreValue['addToHeartBucket']>((userId) => {
    setDb((d) => {
      const uid = sessionIdRef.current as string;
      if (d.heartBucket.some((h) => h.userId === uid && h.targetUserId === userId)) return d;
      return {
        ...d,
        heartBucket: [...d.heartBucket, { userId: uid, targetUserId: userId }]
      };
    });
  }, []);

  const removeFromHeartBucket = useCallback<StoreValue['removeFromHeartBucket']>((userId) => {
    setDb((d) => {
      const uid = sessionIdRef.current as string;
      return {
        ...d,
        heartBucket: d.heartBucket.filter((h) => !(h.userId === uid && h.targetUserId === userId))
      };
    });
  }, []);

  /* ------------------------------------------------------------ wingles */

  const sendWingle = useCallback<StoreValue['sendWingle']>(
    (toUserId, note) => {
      if (!currentUser || !entitlements) return { ok: false, error: 'Sign in first.' };
      if (db.wingles.some((r) => r.fromUserId === currentUser.id && r.toUserId === toUserId))
      return { ok: false, error: 'You have already sent this person a wingle.', reason: 'invalid' };
      if (entitlements.winglesRemaining !== null && entitlements.winglesRemaining <= 0)
      return {
        ok: false,
        error: 'You have used every wingling wingle in your package.',
        reason: 'wingle_limit'
      };
      const wingle: WinglingWingle = {
        id: makeId('rq'),
        fromUserId: currentUser.id,
        toUserId,
        note: note.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      setDb((d) => ({
        ...d,
        wingles: [wingle, ...d.wingles],
        usage: d.usage.map((u) =>
        u.userId === currentUser.id ? { ...u, winglesUsed: u.winglesUsed + 1 } : u
        )
      }));
      return { ok: true, data: wingle };
    },
    [currentUser, db.wingles, entitlements]
  );

  const respondToWingle = useCallback<StoreValue['respondToWingle']>(
    (wingleId, status) => {
      setDb((d) => {
        const wingle = d.wingles.find((r) => r.id === wingleId);
        if (!wingle) return d;
        const next: Db = {
          ...d,
          wingles: d.wingles.map((r) =>
          r.id === wingleId ? { ...r, status, respondedAt: new Date().toISOString() } : r
          )
        };
        if (status === 'accepted') {
          const pair: [string, string] = [wingle.fromUserId, wingle.toUserId];
          next.connections = [
          ...d.connections,
          { id: makeId('cn'), userIds: pair, createdAt: new Date().toISOString() }];

          const exists = d.conversations.find(
            (c) => c.userIds.includes(pair[0]) && c.userIds.includes(pair[1])
          );
          if (!exists) {
            next.conversations = [
            ...d.conversations,
            {
              id: makeId('cv'),
              userIds: pair,
              createdAt: new Date().toISOString(),
              lastMingleAt: new Date().toISOString()
            }];

          }
        }
        return next;
      });
      if (status === 'accepted') {
        notify({
          userId: sessionIdRef.current as string,
          type: 'connection',
          title: 'New connection',
          body: 'You can start a conversation whenever you are ready.',
          href: '/mingles'
        });
      }
    },
    [notify]
  );

  const sentWingles = useCallback<StoreValue['sentWingles']>(
    () =>
    db.wingles.
    filter((r) => r.fromUserId === sessionId).
    sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [db.wingles, sessionId]
  );

  const incomingWingles = useCallback<StoreValue['incomingWingles']>(
    () =>
    db.wingles.
    filter((r) => r.toUserId === sessionId).
    sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [db.wingles, sessionId]
  );

  const wingleStatusWith = useCallback<StoreValue['wingleStatusWith']>(
    (userId) =>
    db.wingles.find(
      (r) =>
      r.fromUserId === sessionId && r.toUserId === userId ||
      r.toUserId === sessionId && r.fromUserId === userId
    ),
    [db.wingles, sessionId]
  );

  /* ---------------------------------------------------------------- chat */

  const conversationsOf = useCallback<StoreValue['conversationsOf']>(
    () =>
    db.conversations.
    filter((c) => c.userIds.includes(sessionId ?? '')).
    sort((a, b) => new Date(b.lastMingleAt).getTime() - new Date(a.lastMingleAt).getTime()),
    [db.conversations, sessionId]
  );

  const conversationWith = useCallback<StoreValue['conversationWith']>(
    (userId) =>
    db.conversations.find((c) => c.userIds.includes(sessionId ?? '') && c.userIds.includes(userId)),
    [db.conversations, sessionId]
  );

  const ensureConversation = useCallback<StoreValue['ensureConversation']>(
    (userId) => {
      const existing = db.conversations.find(
        (c) => c.userIds.includes(sessionId ?? '') && c.userIds.includes(userId)
      );
      if (existing) return existing;
      const conversation: Conversation = {
        id: makeId('cv'),
        userIds: [sessionId as string, userId],
        createdAt: new Date().toISOString(),
        lastMingleAt: new Date().toISOString()
      };
      setDb((d) => ({ ...d, conversations: [...d.conversations, conversation] }));
      return conversation;
    },
    [db.conversations, sessionId]
  );

  const minglesOf = useCallback<StoreValue['minglesOf']>(
    (conversationId) =>
    db.mingles.
    filter((m) => m.conversationId === conversationId).
    sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [db.mingles]
  );

  const sendMingle = useCallback<StoreValue['sendMingle']>(
    (conversationId, body, imageUrl) => {
      if (!currentUser || !entitlements) return { ok: false, error: 'Sign in first.' };
      if (!body.trim() && !imageUrl) return { ok: false, error: 'Write something first.', reason: 'invalid' };
      if (entitlements.chatRemaining !== null && entitlements.chatRemaining <= 0)
      return { ok: false, error: 'Your chat limit has been reached.', reason: 'chat_limit' };

      const mingle: Mingle = {
        id: makeId('ms'),
        conversationId,
        senderId: currentUser.id,
        body: body.trim(),
        imageUrl,
        createdAt: new Date().toISOString(),
        readAt: null,
        deleted: false
      };
      setDb((d) => ({
        ...d,
        mingles: [...d.mingles, mingle],
        conversations: d.conversations.map((c) =>
        c.id === conversationId ? { ...c, lastMingleAt: mingle.createdAt } : c
        ),
        usage: d.usage.map((u) =>
        u.userId === currentUser.id ? { ...u, chatUsed: u.chatUsed + 1 } : u
        )
      }));

      const remainingAfter =
      entitlements.chatRemaining === null ? null : entitlements.chatRemaining - 1;
      if (remainingAfter !== null && remainingAfter === 0) {
        notify({
          userId: currentUser.id,
          type: 'chat_limit_reached',
          title: 'Chat limit reached',
          body: 'Upgrade your package to keep your conversations going.',
          href: '/packages'
        });
      } else if (remainingAfter !== null && remainingAfter <= 3) {
        notify({
          userId: currentUser.id,
          type: 'chat_limit_warning',
          title: `${remainingAfter} mingles left`,
          body: 'Your chat allowance is nearly used up.',
          href: '/packages'
        });
      }

      // Send mingle via PeerJS to the other user
      const conversation = db.conversations.find((c) => c.id === conversationId);
      const otherId = conversation?.userIds.find((uid) => uid !== currentUser.id);
      
      if (otherId && peerRef.current) {
        try {
          const conn = peerRef.current.connect(otherId, { reliable: true });
          conn.on('open', () => {
            conn.send({ type: 'mingle', mingle });
            setTimeout(() => conn.close(), 1000);
          });
        } catch (err) {
          console.error("PeerJS connect error", err);
        }
      }
      return { ok: true, data: mingle };
    },
    [currentUser, db.conversations, entitlements, notify]
  );

  const markConversationRead = useCallback<StoreValue['markConversationRead']>((conversationId) => {
    setDb((d) => ({
      ...d,
      mingles: d.mingles.map((m) =>
      m.conversationId === conversationId && m.senderId !== sessionIdRef.current && !m.readAt ?
      { ...m, readAt: new Date().toISOString() } :
      m
      )
    }));
  }, []);

  const deleteMingle = useCallback<StoreValue['deleteMingle']>((mingleId) => {
    setDb((d) => ({
      ...d,
      mingles: d.mingles.map((m) =>
      m.id === mingleId ? { ...m, deleted: true, body: '', imageUrl: undefined } : m
      )
    }));
  }, []);

  const openChatPopup = useCallback((conversationId: string) => {
    setActivePopupChatId(conversationId);
  }, []);

  const closeChatPopup = useCallback(() => {
    setActivePopupChatId(null);
  }, []);

  /* -------------------------------------------------------------- safety */

  const blockUser = useCallback<StoreValue['blockUser']>((userId) => {
    setDb((d) => ({
      ...d,
      blocks: [
      ...d.blocks,
      {
        id: makeId('bl'),
        blockerId: sessionIdRef.current as string,
        blockedUserId: userId,
        createdAt: new Date().toISOString()
      }]

    }));
  }, []);

  const unblockUser = useCallback<StoreValue['unblockUser']>((userId) => {
    setDb((d) => ({
      ...d,
      blocks: d.blocks.filter(
        (b) => !(b.blockerId === sessionIdRef.current && b.blockedUserId === userId)
      )
    }));
  }, []);

  const isBlocked = useCallback<StoreValue['isBlocked']>(
    (userId) => db.blocks.some((b) => b.blockerId === sessionId && b.blockedUserId === userId),
    [db.blocks, sessionId]
  );

  const reportUser = useCallback<StoreValue['reportUser']>((userId, reason, detail, context) => {
    setDb((d) => ({
      ...d,
      reports: [
      {
        id: makeId('rp'),
        reporterId: sessionIdRef.current as string,
        targetUserId: userId,
        reason,
        detail,
        context,
        status: 'open',
        createdAt: new Date().toISOString()
      },
      ...d.reports]

    }));
  }, []);

  /* ------------------------------------------------------------ payments */

  const purchasePackage = useCallback<StoreValue['purchasePackage']>(
    async (packageId, card) => {
      if (!currentUser) return { ok: false, error: 'Sign in first.' };
      const pkg = db.packages.find((p) => p.id === packageId);
      if (!pkg || !pkg.active) return { ok: false, error: 'That package is not available.' };
      const digits = card.number.replace(/\s/g, '');
      if (digits.length < 15 || !card.name.trim())
      return { ok: false, error: 'Enter valid card details.', reason: 'invalid' };

      // Server-side verification step — nothing unlocks before it resolves.
      await new Promise((resolve) => setTimeout(resolve, 1400));
      const declined = digits.endsWith('0000');
      const payment: Payment = {
        id: makeId('pay'),
        userId: currentUser.id,
        packageId,
        amount: pkg.price,
        status: declined ? 'failed' : 'succeeded',
        method: `Card •••• ${digits.slice(-4)}`,
        reference: `KDR-${Math.floor(1000 + Math.random() * 8999)}-${card.name.
        slice(0, 2).
        toUpperCase()}`,
        createdAt: new Date().toISOString()
      };
      setDb((d) => ({ ...d, payments: [payment, ...d.payments] }));
      if (declined) return { ok: false, error: 'Your bank declined this payment.', reason: 'invalid' };

      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + pkg.durationDays * 86_400_000);
      setDb((d) => ({
        ...d,
        subscriptions: [
        ...d.subscriptions.map((s) =>
        s.userId === currentUser.id && s.status === 'active' ?
        { ...s, status: 'cancelled' as const } :
        s
        ),
        {
          id: makeId('sub'),
          userId: currentUser.id,
          packageId,
          status: 'active',
          startedAt: startedAt.toISOString(),
          expiresAt: expiresAt.toISOString()
        }],

        // A new package resets the allowance counters for the new period.
        usage: d.usage.some((u) => u.userId === currentUser.id) ?
        d.usage.map((u) => u.userId === currentUser.id ? { ...u, chatUsed: 0, winglesUsed: 0 } : u) :
        [...d.usage, { userId: currentUser.id, chatUsed: 0, winglesUsed: 0 }]
      }));
      notify({
        userId: currentUser.id,
        type: 'package_activated',
        title: `${pkg.name} activated`,
        body: 'Your allowances have been topped up and incoming wingles are unlocked.',
        href: '/subscription'
      });
      return { ok: true, data: payment };
    },
    [currentUser, db.packages, notify]
  );

  const paymentsOf = useCallback<StoreValue['paymentsOf']>(
    (userId) =>
    db.payments.
    filter((p) => p.userId === userId).
    sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [db.payments]
  );

  /* ------------------------------------------------------- notifications */

  const notificationsOf = useCallback<StoreValue['notificationsOf']>(
    () =>
    db.notifications.
    filter((n) => n.userId === sessionId).
    sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [db.notifications, sessionId]
  );

  const markNotificationRead = useCallback<StoreValue['markNotificationRead']>((notificationId) => {
    setDb((d) => ({
      ...d,
      notifications: d.notifications.map((n) => n.id === notificationId ? { ...n, read: true } : n)
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setDb((d) => ({
      ...d,
      notifications: d.notifications.map((n) =>
      n.userId === sessionIdRef.current ? { ...n, read: true } : n
      )
    }));
  }, []);

  /* --------------------------------------------------------------- admin */

  const savePackage = useCallback<StoreValue['savePackage']>((pkg) => {
    setDb((d) => ({
      ...d,
      packages: d.packages.some((p) => p.id === pkg.id) ?
      d.packages.map((p) => p.id === pkg.id ? pkg : p) :
      [...d.packages, pkg]
    }));
  }, []);

  const deletePackage = useCallback<StoreValue['deletePackage']>((packageId) => {
    setDb((d) => ({ ...d, packages: d.packages.filter((p) => p.id !== packageId) }));
  }, []);

  const setUserSuspended = useCallback<StoreValue['setUserSuspended']>((userId, suspended) => {
    setDb((d) => ({ ...d, users: d.users.map((u) => u.id === userId ? { ...u, suspended } : u) }));
  }, []);

  const setUserVerified = useCallback<StoreValue['setUserVerified']>((userId, verified) => {
    setDb((d) => ({ ...d, users: d.users.map((u) => u.id === userId ? { ...u, verified } : u) }));
  }, []);

  const removeUser = useCallback<StoreValue['removeUser']>((userId) => {
    setDb((d) => ({
      ...d,
      users: d.users.filter((u) => u.id !== userId),
      photos: d.photos.filter((p) => p.userId !== userId)
    }));
  }, []);

  const moderatePhoto = useCallback<StoreValue['moderatePhoto']>((photoId, state) => {
    setDb((d) => ({
      ...d,
      photos: d.photos.map((p) => p.id === photoId ? { ...p, moderation: state } : p)
    }));
  }, []);

  const resolveReport = useCallback<StoreValue['resolveReport']>((reportId, status) => {
    setDb((d) => ({
      ...d,
      reports: d.reports.map((r) => r.id === reportId ? { ...r, status } : r)
    }));
  }, []);

  const refundPayment = useCallback<StoreValue['refundPayment']>((paymentId) => {
    setDb((d) => ({
      ...d,
      payments: d.payments.map((p) => p.id === paymentId ? { ...p, status: 'refunded' } : p)
    }));
    toast.success('Payment refunded');
  }, []);

  const statusesOf = useCallback<StoreValue['statusesOf']>((userId) => {
    const now = new Date().toISOString();
    return db.statuses
      .filter((s) => s.userId === userId && s.expiresAt > now)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [db.statuses]);

  const myStatuses = useCallback<StoreValue['myStatuses']>(() => {
    if (!sessionId) return [];
    return statusesOf(sessionId);
  }, [sessionId, statusesOf]);

  const addStatus = useCallback<StoreValue['addStatus']>((photoUrl) => {
    if (!sessionId) return;
    const now = Date.now();
    const newStatus: UserStatus = {
      id: makeId('status'),
      userId: sessionId,
      photoUrl,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 24 * 3_600_000).toISOString()
    };
    setDb((d) => ({ ...d, statuses: [...d.statuses, newStatus] }));
    toast.success('Status updated');
  }, [sessionId]);

  const deleteStatus = useCallback<StoreValue['deleteStatus']>((statusId) => {
    setDb((d) => ({ ...d, statuses: d.statuses.filter((s) => s.id !== statusId) }));
  }, []);

  const value: StoreValue = {
    db,
    currentUser,
    entitlements,
    freePackage,
    login,
    register,
    logout,
    completeOnboarding,
    updateProfile,
    deleteAccount,
    photosOf,
    addPhoto,
    deletePhoto,
    setPrimaryPhoto,
    movePhoto,
    discoverFeed,
    userById,
    likeUser,
    passUser,
    hasLiked,
    likesReceived,
    heartBucketOf,
    addToHeartBucket,
    removeFromHeartBucket,
    sendWingle,
    respondToWingle,
    sentWingles,
    incomingWingles,
    wingleStatusWith,
    conversationsOf,
    conversationWith,
    ensureConversation,
    minglesOf,
    sendMingle,
    markConversationRead,
    deleteMingle,
    typingIn,
    activePopupChatId,
    openChatPopup,
    closeChatPopup,
    blockUser,
    unblockUser,
    isBlocked,
    reportUser,
    purchasePackage,
    activeSubscription,
    paymentsOf,
    notificationsOf,
    markNotificationRead,
    markAllNotificationsRead,
    savePackage,
    deletePackage,
    setUserSuspended,
    setUserVerified,
    removeUser,
    moderatePhoto,
    resolveReport,
    refundPayment,
    statusesOf,
    myStatuses,
    addStatus,
    deleteStatus
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export { DEMO_USER_ID, ADMIN_USER_ID };