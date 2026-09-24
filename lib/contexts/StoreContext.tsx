'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { sendMingleAction, markConversationReadAction } from '@/app/actions/chat';
import type {
  AppNotification,
  Block,
  Connection,
  Conversation,
  WinglingWingle,
  Entitlements,
  Like,
  Mingle,
  SecretWingle,
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
  DEMO_USER_ID
} from '@/lib/data/seed';
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
  passes: {userId: string;targetUserId: string; viewed?: boolean; createdAt?: string}[];
  heartBucket: {userId: string;targetUserId: string; viewed?: boolean; createdAt?: string}[];
  wingles: WinglingWingle[];
  connections: Connection[];
  conversations: Conversation[];
  mingles: Mingle[];
  notifications: AppNotification[];
  reports: Report[];
  blocks: Block[];
  statuses: UserStatus[];
  secretWingles: SecretWingle[];
}

const initialDb: Db = {
  users: [],
  photos: [],
  packages: seedPackages,
  subscriptions: [],
  payments: [],
  usage: [{ userId: DEMO_USER_ID, chatUsed: 2, winglesUsed: 3 }],
  likes: [],
  passes: [],
  heartBucket: [],
  wingles: [],
  connections: [],
  conversations: [],
  mingles: [],
  notifications: [],
  reports: [],
  blocks: [],
  statuses: [],
  secretWingles: []
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
  unlikeUser: (userId: string) => void;
  passUser: (userId: string) => void;
  hasLiked: (userId: string) => boolean;
  likesReceived: () => Like[];
  unreadLikesCount: () => number;
  markLikesViewed: () => void;
  heartBucketOf: () => User[];
  addToHeartBucket: (userId: string) => void;
  removeFromHeartBucket: (userId: string) => void;
  unreadHeartBucketCount: () => number;
  markHeartBucketViewed: () => void;
  brokenHeartOf: () => User[];
  removeFromPasses: (userId: string) => void;
  unreadBrokenHeartCount: () => number;
  markBrokenHeartViewed: () => void;
  // wingles
  sendWingle: (toUserId: string, note: string) => ServerResult<WinglingWingle>;
  respondToWingle: (wingleId: string, status: 'accepted' | 'declined') => void;
  sentWingles: () => WinglingWingle[];
  incomingWingles: () => WinglingWingle[];
  unreadWinglesCount: () => number;
  markWinglesViewed: () => void;
  wingleStatusWith: (userId: string) => WinglingWingle | undefined;
  // secret wingles
  secretWinglesReceived: () => SecretWingle[];
  sendSecretWingle: (targetPhone: string, message: string) => Promise<ServerResult<SecretWingle>>;
  // chat
  conversationsOf: () => Conversation[];
  conversationWith: (userId: string) => Conversation | undefined;
  ensureConversation: (userId: string) => Conversation;
  minglesOf: (conversationId: string) => Mingle[];
  sendMingle: (conversationId: string, body: string, imageUrl?: string, replyToId?: string | null, forwarded?: boolean, viewOnce?: boolean) => ServerResult<Mingle>;
  markConversationRead: (conversationId: string) => void;
  deleteMingle: (mingleId: string, type: 'me' | 'everyone') => void;
  reactToMingle: (mingleId: string, emoji: string) => void;
  forwardMingles: (mingleIds: string[], conversationIds: string[]) => void;
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
  isHydrated: boolean;
}

export const maskUser = (user: User, sessionId: string | null): User => {
  if (user.id === sessionId || !user.isAnonymous) return user;
  return {
    ...user,
    name: user.anonymousName || 'Anonymous',
    age: 0,
    location: 'Hidden',
    bio: '',
    lifestyle: {
      drinking: '',
      smoking: '',
      exercise: '',
      pets: '',
      children: '',
      education: '',
      work: ''
    },
    traits: [],
    interests: []
  };
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: {children: React.ReactNode;}) {
  const [db, setDb] = useState<Db>(initialDb);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [typingIn] = useState<string | null>(null);
  const [activePopupChatId, setActivePopupChatId] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = sessionId;
  const peerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, []);

  const showNotification = useCallback((title: string, body: string, icon?: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
      try {
        const notif = new Notification(title, { body, icon: icon || '/favicon.png' });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.error("Failed to show notification", e);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('winglemingle_mingles');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setDb(d => ({ ...d, mingles: parsed }));
          }
        }
      } catch (e) {}
      
      // Fetch the real user from the server session and all discover users
      import('@/app/actions/user').then(({ getCurrentUser, getDiscoverUsers, getUserStateAction }) => {
        Promise.all([
          getCurrentUser(), 
          getDiscoverUsers()
        ]).then(([user, discoverRes]) => {
          let realUsers: User[] = [];
          if (discoverRes?.ok && Array.isArray(discoverRes.data)) {
            realUsers = discoverRes.data as User[];
          }

          if (user) {
            const mappedUser = {
              ...user,
              lastActiveAt: user.lastActiveAt?.toString() || new Date().toISOString(),
              createdAt: user.createdAt?.toString() || new Date().toISOString()
            } as User;
            
            setDb(d => {
              const allUsers = [...realUsers];
              if (!allUsers.find(u => u.id === mappedUser.id)) {
                allUsers.push(mappedUser);
              }
              const allPhotos = allUsers.flatMap((u: any) => u.photos || []);
              
              // Ensure all users have heartReacts, even mock ones
              allUsers.forEach(u => {
                if (u.heartReacts === undefined) {
                  u.heartReacts = ((u.id.charCodeAt(0) + u.id.charCodeAt(u.id.length - 1)) % 50) + 1;
                }
              });
              
              return { 
                ...d, 
                users: allUsers, 
                photos: allPhotos
              };
            });
            setSessionId(user.id);
          } else {
            const allPhotos = realUsers.flatMap((u: any) => u.photos || []);
            setDb(d => {
              // Ensure all users have heartReacts, even mock ones
              realUsers.forEach(u => {
                if (u.heartReacts === undefined) {
                  u.heartReacts = ((u.id.charCodeAt(0) + u.id.charCodeAt(u.id.length - 1)) % 50) + 1;
                }
              });
              return { 
                ...d, 
                users: realUsers, 
                photos: allPhotos
              };
            });
            setSessionId(null);
          }
          
          setIsHydrated(true);

          // Now fetch secondary data in the background
          if (user) {
            import('@/app/actions/chat').then(({ getConversationsAction }) => {
              import('@/app/actions/wingle').then(({ getReceivedSecretWinglesAction }) => {
                Promise.all([
                  getConversationsAction(),
                  getUserStateAction(),
                  getReceivedSecretWinglesAction()
                ]).then(([chatRes, stateRes, secretWinglesRes]) => {
                  setDb(d => {
                    let updatedConvs = d.conversations;
                    let updatedMingles = d.mingles;
                    if (chatRes?.ok && chatRes.data) {
                      updatedConvs = chatRes.data.conversations as unknown as Conversation[];
                      updatedMingles = chatRes.data.mingles as unknown as Mingle[];
                    }

                    let newLikes = d.likes;
                    let newPasses = d.passes;
                    let newHeartBucket = d.heartBucket;
                    let newWingles = d.wingles;
                    let newConns = d.connections;
                    let newSecretWingles = d.secretWingles;
                    const allUsers = [...d.users];
                    const allPhotos = [...d.photos];

                    if (stateRes?.ok && stateRes.data) {
                      newLikes = stateRes.data.likes as any[];
                      newPasses = stateRes.data.passes as any[];
                      newHeartBucket = stateRes.data.heartBucket as any[];
                      newWingles = stateRes.data.wingles as any[];
                      newConns = stateRes.data.connections as any[];
                      
                      if (stateRes.data.relatedUsers) {
                        const relatedUsers = stateRes.data.relatedUsers as any[];
                        relatedUsers.forEach(ru => {
                          if (!allUsers.find(u => u.id === ru.id)) {
                            if (ru.heartReacts === undefined) {
                              ru.heartReacts = ((ru.id.charCodeAt(0) + ru.id.charCodeAt(ru.id.length - 1)) % 50) + 1;
                            }
                            allUsers.push(ru);
                            allPhotos.push(...(ru.photos || []));
                          }
                        });
                      }
                    }

                    if (secretWinglesRes?.ok && secretWinglesRes.data) {
                      newSecretWingles = secretWinglesRes.data as SecretWingle[];
                      newSecretWingles.forEach(sw => {
                        if (sw.sender && !allUsers.find(u => u.id === sw.senderId)) {
                          const s = sw.sender as any;
                          if (s.heartReacts === undefined) {
                            s.heartReacts = ((s.id.charCodeAt(0) + s.id.charCodeAt(s.id.length - 1)) % 50) + 1;
                          }
                          allUsers.push(s);
                          allPhotos.push(...(s.photos || []));
                        }
                      });
                    }

                    return { 
                      ...d, 
                      users: allUsers, 
                      photos: allPhotos,
                      conversations: updatedConvs,
                      mingles: updatedMingles,
                      likes: newLikes,
                      passes: newPasses,
                      heartBucket: newHeartBucket,
                      wingles: newWingles,
                      connections: newConns,
                      secretWingles: newSecretWingles
                    };
                  });
                });
              });
            });
          }
        }).catch((e) => {
          console.error("Hydration error:", e);
          setIsHydrated(true);
        });
      });
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

  // Fallback polling mechanism to ensure real-time updates if PeerJS fails
  useEffect(() => {
    if (!sessionId || !isHydrated) return;
    const interval = setInterval(() => {
      import('@/app/actions/chat').then(({ getConversationsAction }) => {
        import('@/app/actions/user').then(({ getUserStateAction }) => {
          Promise.all([getConversationsAction(), getUserStateAction()]).then(([chatRes, stateRes]) => {
            setDb(d => {
              let nextDb = { ...d };
              let changed = false;

              if (chatRes?.ok && chatRes.data) {
                const updatedConvs = chatRes.data.conversations as unknown as Conversation[];
                const updatedMingles = chatRes.data.mingles as unknown as Mingle[];
                
                const isDifferent = 
                  d.mingles.length !== updatedMingles.length ||
                  d.conversations.length !== updatedConvs.length ||
                  JSON.stringify(d.mingles) !== JSON.stringify(updatedMingles);

                if (isDifferent) {
                  const newMingles = updatedMingles.filter(m => m.senderId !== sessionIdRef.current && !d.mingles.find(dm => dm.id === m.id));
                  if (newMingles.length > 0 && typeof document !== 'undefined' && document.hidden) {
                    const latest = newMingles[newMingles.length - 1];
                    const sender = d.users?.find((u: any) => u.id === latest.senderId);
                    showNotification(`New message from ${sender?.name || 'someone'}`, latest.body || '📷 Photo', sender?.photos?.[0]?.url);
                  }
                  nextDb.conversations = updatedConvs;
                  nextDb.mingles = updatedMingles;
                  changed = true;
                }
              }

              if (stateRes?.ok && stateRes.data) {
                const newWingles = stateRes.data.wingles as any[];
                if (d.wingles.length !== newWingles.length || JSON.stringify(d.wingles) !== JSON.stringify(newWingles)) {
                  nextDb.wingles = newWingles;
                  changed = true;
                }
                const newConnections = stateRes.data.connections as any[];
                if (d.connections.length !== newConnections.length) {
                  nextDb.connections = newConnections;
                  changed = true;
                }
                const newLikes = stateRes.data.likes as any[];
                if (d.likes.length !== newLikes.length) {
                  nextDb.likes = newLikes;
                  changed = true;
                }
                const newPasses = stateRes.data.passes as any[];
                if (d.passes.length !== newPasses.length) {
                  nextDb.passes = newPasses;
                  changed = true;
                }
                const newHeartBucket = stateRes.data.heartBucket as any[];
                if (d.heartBucket.length !== newHeartBucket.length) {
                  nextDb.heartBucket = newHeartBucket;
                  changed = true;
                }
                
                if (stateRes.data.relatedUsers) {
                  const rUsers = stateRes.data.relatedUsers as any[];
                  const allUsers = [...(nextDb.users || d.users)];
                  const allPhotos = [...(nextDb.photos || d.photos)];
                  let usersChanged = false;
                  
                  rUsers.forEach(ru => {
                    if (!allUsers.find(u => u.id === ru.id)) {
                      if (ru.heartReacts === undefined) {
                        ru.heartReacts = ((ru.id.charCodeAt(0) + ru.id.charCodeAt(ru.id.length - 1)) % 50) + 1;
                      }
                      allUsers.push(ru);
                      allPhotos.push(...(ru.photos || []));
                      usersChanged = true;
                    }
                  });
                  
                  if (usersChanged) {
                    nextDb.users = allUsers;
                    nextDb.photos = allPhotos;
                    changed = true;
                  }
                }
              }

              return changed ? nextDb : d;
            });
          }).catch(console.error);
        });
      });
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [sessionId, isHydrated]);

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
              
              if (typeof document !== 'undefined' && document.hidden) {
                const sender = d.users.find((u) => u.id === mingle.senderId);
                showNotification(`New message from ${sender?.name || 'someone'}`, mingle.body || '📷 Photo', sender?.photos?.[0]?.url);
              }

              const convExists = d.conversations.find((c) => c.id === mingle.conversationId);
              let newConvs = d.conversations;
              if (convExists) {
                newConvs = d.conversations.map((c) =>
                  c.id === mingle.conversationId ? { ...c, lastMingleAt: mingle.createdAt } : c
                );
              } else {
                newConvs = [...d.conversations, {
                  id: mingle.conversationId,
                  userIds: [sessionId, mingle.senderId],
                  createdAt: mingle.createdAt,
                  lastMingleAt: mingle.createdAt
                }];
              }
              
              return {
                ...d,
                mingles: [...d.mingles, mingle],
                conversations: newConvs
              };
            });

            // Send delivery receipt back to sender
            import('@/app/actions/chat').then(({ markMingleDeliveredAction }) => {
              markMingleDeliveredAction([mingle.id]).catch(console.error);
            });
            const now = new Date().toISOString();
            setDb((d) => ({
              ...d,
              mingles: d.mingles.map((m) => m.id === mingle.id ? { ...m, deliveredAt: now } : m)
            }));

            try {
              const replyConn = peer.connect(mingle.senderId, { reliable: true });
              if (replyConn) {
                replyConn.on('open', () => {
                  replyConn.send({ type: 'delivery_receipt', mingleIds: [mingle.id], deliveredAt: now });
                  
                });
              }
            } catch (err) {
              console.error("PeerJS delivery receipt error", err);
            }

          } else if (data.type === 'delivery_receipt') {
            const { mingleIds, deliveredAt } = data;
            setDb((d) => ({
              ...d,
              mingles: d.mingles.map((m) =>
                mingleIds.includes(m.id) && !m.deliveredAt ? { ...m, deliveredAt } : m
              )
            }));
          } else if (data.type === 'delete_mingle') {
            const { mingleId, deleteType } = data;
            if (deleteType === 'everyone') {
              setDb((d) => ({
                ...d,
                mingles: d.mingles.map((m) => 
                  m.id === mingleId ? { ...m, deleted: true, body: '', imageUrl: undefined, reactions: null } : m
                )
              }));
            } else {
              setDb((d) => ({
                ...d,
                mingles: d.mingles.map((m) =>
                  m.id === mingleId ? { ...m, deletedFor: [...(m.deletedFor || []), conn.peer] } : m
                )
              }));
            }
          } else if (data.type === 'react_mingle') {
            const { mingleId, reactions } = data;
            setDb((d) => ({
              ...d,
              mingles: d.mingles.map((m) =>
                m.id === mingleId ? { ...m, reactions } : m
              )
            }));
          } else if (data.type === 'read_receipt') {
            const { conversationId, readAt } = data;
            setDb((d) => ({
              ...d,
              mingles: d.mingles.map((m) => 
                m.conversationId === conversationId && m.senderId === sessionId && !m.readAt
                  ? { ...m, readAt }
                  : m
              )
            }));
          } else if (data.type === 'wingle_received') {
            const wingle = data.wingle;
            setDb((d) => {
              if (d.wingles.find(w => w.id === wingle.id)) return d;
              return { ...d, wingles: [wingle, ...d.wingles] };
            });
          } else if (data.type === 'wingle_accepted') {
            const { wingleId, connectionId, conversationId, u1, u2 } = data;
            setDb((d) => {
              const wingle = d.wingles.find(w => w.id === wingleId);
              if (!wingle || wingle.status === 'accepted') return d;
              return {
                ...d,
                wingles: d.wingles.map(w => w.id === wingleId ? { ...w, status: 'accepted' as any } : w),
                connections: [...d.connections, { id: connectionId, userIds: [u1, u2], createdAt: new Date().toISOString() }],
                conversations: [...d.conversations, { id: conversationId, userIds: [u1, u2], createdAt: new Date().toISOString(), lastMingleAt: new Date().toISOString() }]
              };
            });
          } else if (data.type === 'wingle_declined') {
            const { wingleId } = data;
            setDb((d) => {
              const wingle = d.wingles.find(w => w.id === wingleId);
              if (!wingle || wingle.status === 'declined') return d;
              return {
                ...d,
                wingles: d.wingles.map(w => w.id === wingleId ? { ...w, status: 'declined' as any } : w)
              };
            });
          } else if (data.type === 'new_match') {
            const { connectionId, conversationId, u1, u2 } = data;
            setDb((d) => {
              const connectionExists = d.connections.find(c => c.id === connectionId);
              if (connectionExists) return d;
              return {
                ...d,
                connections: [...d.connections, { id: connectionId, userIds: [u1, u2], createdAt: new Date().toISOString() }],
                conversations: [...d.conversations, { id: conversationId, userIds: [u1, u2], createdAt: new Date().toISOString(), lastMingleAt: new Date().toISOString() }]
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

  const currentUser = useMemo(() => {
    const u = db.users.find((u) => u.id === sessionId);
    if (!u) return null;
    if (u.isAnonymous && u.anonymousName) {
      return { ...u, name: u.anonymousName };
    }
    return u;
  }, [db.users, sessionId]);

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
      packageName: 'Unlimited (Beta)',
      chatLimit: null,
      chatUsed: usage.chatUsed,
      chatRemaining: null,
      wingleLimit: null,
      winglesUsed: usage.winglesUsed,
      winglesRemaining: null,
      incomingWinglesUnlocked: true,
      priorityVisibility: true,
      subscriptionStatus: 'active',
      subscriptionExpiry: null
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

  const sendPeerEvent = useCallback((userId: string, data: any) => {
    if (peerRef.current) {
      try {
        const conn = peerRef.current.connect(userId, { reliable: true });
        if (conn) {
          conn.on('open', () => {
            conn.send(data);
            
          });
        }
      } catch (err) {
        console.error("PeerJS connect error", err);
      }
    }
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
    import('@/app/actions/auth').then(({ logoutUser }) => {
      logoutUser().catch(console.error);
    });
  }, []);

  useEffect(() => {
    if (currentUser?.suspended) {
      toast.error('Your account has been suspended.');
      logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/sign-in') {
        window.location.href = '/sign-in';
      }
    }
  }, [currentUser?.suspended, logout]);

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
    import('@/app/actions/user').then(({ updateUserProfile }) => {
      updateUserProfile(patch).catch(console.error);
    });
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
    (userId) => {
      const u = db.users.find((user) => user.id === userId);
      if (u?.isAnonymous && u.id !== sessionIdRef.current) return [];
      const userPhotos = db.photos.
      filter((p) => p.userId === userId && p.moderation !== 'rejected').
      sort((a, b) => a.order - b.order);
      
      if (userPhotos.length === 0 && u) {
        return [{
          id: `default-${u.id}`,
          userId: u.id,
          url: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(u.name || 'User')}&backgroundColor=ff6b6b,ff8e53&textColor=ffffff`,
          order: 0,
          isPrimary: true,
          moderation: 'approved',
          uploadedAt: new Date().toISOString()
        }];
      }
      return userPhotos;
    },
    [db.photos, db.users]
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
    (userId) => {
      const u = db.users.find((user) => user.id === userId);
      return u ? maskUser(u, sessionIdRef.current) : undefined;
    },
    [db.users]
  );

  const discoverFeed = useCallback<StoreValue['discoverFeed']>(() => {
    if (!sessionId) return [];
    const blocked = new Set(
      db.blocks.filter((b) => b.blockerId === sessionId).map((b) => b.blockedUserId)
    );
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const passed = new Set(
      db.passes
        .filter((p) => p.userId === sessionId && (!p.createdAt || new Date(p.createdAt) >= tenDaysAgo))
        .map((p) => p.targetUserId)
    );
    const hearted = new Set(
      db.heartBucket.filter((h) => h.userId === sessionId).map((h) => h.targetUserId)
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
      !passed.has(u.id) &&
      !hearted.has(u.id)
    ).
    sort((a, b) => {
      const pa = premiumIds.has(a.id) ? 1 : 0;
      const pb = premiumIds.has(b.id) ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    }).
    map((u) => maskUser(u, sessionId));
  }, [db.blocks, db.packages, db.passes, db.subscriptions, db.users, sessionId]);

  const likeUser = useCallback<StoreValue['likeUser']>((userId) => {
    // 1. Optimistic Like update
    setDb((d) => {
      const uid = sessionIdRef.current as string;
      if (d.likes.some((l) => l.fromUserId === uid && l.toUserId === userId)) return d;
      const like: Like = {
        id: makeId('lk'),
        fromUserId: uid,
        toUserId: userId,
        createdAt: new Date().toISOString(),
        viewed: false
      };
      
      const isMatch = d.likes.some((l) => l.fromUserId === userId && l.toUserId === uid);
      
      if (isMatch) {
        const connection: Connection = {
          id: makeId('co'),
          userIds: [uid < userId ? uid : userId, uid < userId ? userId : uid],
          createdAt: new Date().toISOString()
        };
        return {
          ...d,
          likes: [...d.likes, like],
          connections: [...d.connections, connection],
          users: d.users.map((u) => u.id === userId ? { ...u, heartReacts: (u.heartReacts || 0) + 1 } : u)
        };
      }
      return { 
        ...d, 
        likes: [...d.likes, like],
        users: d.users.map((u) => u.id === userId ? { ...u, heartReacts: (u.heartReacts || 0) + 1 } : u)
      };
    });

    // 2. Server action
    import('@/app/actions/match').then(({ likeUser: serverLikeUser }) => {
      serverLikeUser(userId).then((res) => {
        if (res.ok && res.matched) {
          toast.success("It's a Match! 🎉");
          // Update DB with the real connection/conversation from the backend
          setDb(d => {
            const uid = sessionIdRef.current as string;
            const u1 = uid < userId ? uid : userId;
            const u2 = uid < userId ? userId : uid;
            
            // Remove the optimistically created fake connection and conversation
            const connections = d.connections.filter(c => !(c.userIds[0] === u1 && c.userIds[1] === u2 && (c.id.startsWith('co') || c.id.startsWith('cn'))));
            const conversations = d.conversations.filter(c => !(c.userIds[0] === u1 && c.userIds[1] === u2 && c.id.startsWith('cv')));
            
            return {
              ...d,
              connections: [...connections, { 
                id: res.connectionId!, 
                userIds: [u1, u2],
                createdAt: new Date().toISOString() 
              }],
              conversations: [...conversations, { 
                id: res.conversationId!, 
                userIds: [u1, u2],
                createdAt: new Date().toISOString(), 
                lastMingleAt: new Date().toISOString() 
              }]
            };
          });

          // Broadcast the new match to the other user
          sendPeerEvent(userId, {
            type: 'new_match',
            connectionId: res.connectionId,
            conversationId: res.conversationId,
            u1: sessionIdRef.current! < userId ? sessionIdRef.current! : userId,
            u2: sessionIdRef.current! < userId ? userId : sessionIdRef.current!
          });
        }
      }).catch(console.error);
    });
  }, []);

  const unlikeUser = useCallback<StoreValue['unlikeUser']>((userId) => {
    setDb((d) => {
      const uid = sessionIdRef.current as string;
      return {
        ...d,
        likes: d.likes.filter((l) => !(l.fromUserId === uid && l.toUserId === userId)),
        users: d.users.map((u) => u.id === userId ? { ...u, heartReacts: Math.max(0, (u.heartReacts || 0) - 1) } : u)
      };
    });

    import('@/app/actions/match').then(({ unlikeUserAction }) => {
      unlikeUserAction(userId).catch(console.error);
    });
  }, []);

  const passUser = useCallback<StoreValue['passUser']>((userId) => {
    setDb((d) => ({
      ...d,
      passes: [...d.passes, { userId: sessionIdRef.current as string, targetUserId: userId, createdAt: new Date().toISOString() }]
    }));
    import('@/app/actions/match').then(({ passUser: serverPassUser }) => {
      serverPassUser(userId).catch(console.error);
    });
  }, []);

  const hasLiked = useCallback<StoreValue['hasLiked']>(
    (userId) => db.likes.some((l) => l.fromUserId === sessionId && l.toUserId === userId),
    [db.likes, sessionId]
  );

  const likesReceived = useCallback<StoreValue['likesReceived']>(
    () => db.likes.filter((l) => l.toUserId === sessionId),
    [db.likes, sessionId]
  );

  const unreadLikesCount = useCallback<StoreValue['unreadLikesCount']>(
    () => db.likes.filter((l) => l.toUserId === sessionId && !l.viewed).length,
    [db.likes, sessionId]
  );

  const markLikesViewed = useCallback<StoreValue['markLikesViewed']>(() => {
    setDb((d) => ({
      ...d,
      likes: d.likes.map((l) => 
        l.toUserId === sessionIdRef.current ? { ...l, viewed: true } : l
      )
    }));
  }, []);

  const heartBucketOf = useCallback<StoreValue['heartBucketOf']>(() => {
    if (!sessionId) return [];
    const heartTargetIds = new Set(
      db.heartBucket.filter((h) => h.userId === sessionId).map((h) => h.targetUserId)
    );
    return db.users.filter((u) => heartTargetIds.has(u.id)).map((u) => maskUser(u, sessionId));
  }, [db.heartBucket, db.users, sessionId]);

  const addToHeartBucket = useCallback<StoreValue['addToHeartBucket']>((userId) => {
    setDb((d) => {
      const uid = sessionIdRef.current as string;
      if (d.heartBucket.some((h) => h.userId === uid && h.targetUserId === userId)) return d;
      return {
        ...d,
        heartBucket: [...d.heartBucket, { userId: uid, targetUserId: userId, createdAt: new Date().toISOString() }],
        users: d.users.map((u) => u.id === userId ? { ...u, heartReacts: (u.heartReacts || 0) + 1 } : u)
      };
    });

    import('@/app/actions/match').then(({ addToHeartBucketAction }) => {
      addToHeartBucketAction(userId).catch(console.error);
    });
  }, []);

  const removeFromHeartBucket = useCallback<StoreValue['removeFromHeartBucket']>((userId) => {
    setDb((d) => {
      const uid = sessionIdRef.current as string;
      return {
        ...d,
        heartBucket: d.heartBucket.filter((h) => !(h.userId === uid && h.targetUserId === userId)),
        users: d.users.map((u) => u.id === userId ? { ...u, heartReacts: Math.max(0, (u.heartReacts || 0) - 1) } : u)
      };
    });
    import('@/app/actions/match').then(({ removeFromHeartBucketAction }) => {
      removeFromHeartBucketAction(userId).catch(console.error);
    });
  }, []);

  const brokenHeartOf = useCallback<StoreValue['brokenHeartOf']>(() => {
    if (!sessionId) return [];
    const passedTargetIds = new Set(
      db.passes.filter((p) => p.userId === sessionId).map((p) => p.targetUserId)
    );
    return db.users.filter((u) => passedTargetIds.has(u.id)).map((u) => maskUser(u, sessionId));
  }, [db.passes, db.users, sessionId]);

  const removeFromPasses = useCallback<StoreValue['removeFromPasses']>((userId) => {
    setDb((d) => {
      const uid = sessionIdRef.current as string;
      return {
        ...d,
        passes: d.passes.filter((p) => !(p.userId === uid && p.targetUserId === userId))
      };
    });
    import('@/app/actions/match').then(({ removeFromPassesAction }) => {
      removeFromPassesAction(userId).catch(console.error);
    });
  }, []);

  const unreadHeartBucketCount = useCallback<StoreValue['unreadHeartBucketCount']>(() => {
    if (!sessionId) return 0;
    return db.heartBucket.filter((h) => h.userId === sessionId && !h.viewed).length;
  }, [db.heartBucket, sessionId]);

  const markHeartBucketViewed = useCallback<StoreValue['markHeartBucketViewed']>(() => {
    setDb((d) => ({
      ...d,
      heartBucket: d.heartBucket.map((h) => 
        h.userId === sessionIdRef.current ? { ...h, viewed: true } : h
      )
    }));
  }, []);

  const unreadBrokenHeartCount = useCallback<StoreValue['unreadBrokenHeartCount']>(() => {
    if (!sessionId) return 0;
    return db.passes.filter((p) => p.userId === sessionId && !p.viewed).length;
  }, [db.passes, sessionId]);

  const markBrokenHeartViewed = useCallback<StoreValue['markBrokenHeartViewed']>(() => {
    setDb((d) => ({
      ...d,
      passes: d.passes.map((p) => 
        p.userId === sessionIdRef.current ? { ...p, viewed: true } : p
      )
    }));
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

      import('@/app/actions/wingle').then(({ sendWingle: serverSendWingle }) => {
        serverSendWingle(toUserId, note).then((res) => {
          if (res.ok && res.wingleId) {
            setDb(d => ({
              ...d,
              wingles: d.wingles.map(w => w.id === wingle.id ? { ...w, id: res.wingleId! } : w)
            }));
            // Broadcast wingle_received to the recipient
            sendPeerEvent(toUserId, { type: 'wingle_received', wingle: { ...wingle, id: res.wingleId! } });
          }
        }).catch(console.error);
      });

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

      import('@/app/actions/wingle').then(({ respondToWingle: serverRespondToWingle }) => {
        serverRespondToWingle(wingleId, status === 'accepted').then((res) => {
          if (res.ok) {
            let wingleForEvent: WinglingWingle | undefined;
            setDb(d => {
              const wingle = d.wingles.find(r => r.id === wingleId);
              if (!wingle) return d;
              wingleForEvent = wingle;
              
              const updatedWingles = d.wingles.map(w => w.id === wingleId ? { ...w, status } : w);
              
              if (status === 'accepted' && res.connectionId) {
                const u1 = wingle.fromUserId < wingle.toUserId ? wingle.fromUserId : wingle.toUserId;
                const u2 = wingle.fromUserId < wingle.toUserId ? wingle.toUserId : wingle.fromUserId;
                const connections = d.connections.filter(c => !(c.userIds[0] === u1 && c.userIds[1] === u2 && (c.id.startsWith('cn') || c.id.startsWith('co'))));
                const conversations = d.conversations.filter(c => !(c.userIds[0] === u1 && c.userIds[1] === u2 && c.id.startsWith('cv')));
                
                return {
                  ...d,
                  wingles: updatedWingles,
                  connections: [...connections, {
                    id: res.connectionId!,
                    userIds: [u1, u2],
                    createdAt: new Date().toISOString()
                  }],
                  conversations: [...conversations, {
                    id: res.conversationId!,
                    userIds: [u1, u2],
                    createdAt: new Date().toISOString(),
                    lastMingleAt: new Date().toISOString()
                  }]
                };
              }
              
              return { ...d, wingles: updatedWingles };
            });
            
            // Broadcast acceptance or decline to the sender
            if (wingleForEvent) {
              if (status === 'accepted') {
                const u1 = wingleForEvent.fromUserId < wingleForEvent.toUserId ? wingleForEvent.fromUserId : wingleForEvent.toUserId;
                const u2 = wingleForEvent.fromUserId < wingleForEvent.toUserId ? wingleForEvent.toUserId : wingleForEvent.fromUserId;
                sendPeerEvent(wingleForEvent.fromUserId, {
                  type: 'wingle_accepted',
                  wingleId,
                  connectionId: res.connectionId,
                  conversationId: res.conversationId,
                  u1, u2
                });
              } else if (status === 'declined') {
                sendPeerEvent(wingleForEvent.fromUserId, {
                  type: 'wingle_declined',
                  wingleId
                });
              }
            }
          }
        }).catch(console.error);
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
    () => db.wingles.filter((w) => w.toUserId === sessionId && w.status !== 'declined').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db.wingles, sessionId]
  );

  const unreadWinglesCount = useCallback<StoreValue['unreadWinglesCount']>(
    () => db.wingles.filter((w) => w.toUserId === sessionId && w.status === 'pending' && !w.viewed).length,
    [db.wingles, sessionId]
  );

  const markWinglesViewed = useCallback<StoreValue['markWinglesViewed']>(() => {
    setDb((d) => ({
      ...d,
      wingles: d.wingles.map((w) => 
        w.toUserId === sessionIdRef.current && w.status === 'pending' ? { ...w, viewed: true } : w
      )
    }));
    import('@/app/actions/wingle').then(({ markWinglesViewedAction }) => {
      markWinglesViewedAction().catch(console.error);
    });
  }, []);

  const wingleStatusWith = useCallback<StoreValue['wingleStatusWith']>(
    (userId) =>
    db.wingles.find(
      (r) =>
      r.fromUserId === sessionId && r.toUserId === userId ||
      r.toUserId === sessionId && r.fromUserId === userId
    ),
    [db.wingles, sessionId]
  );

  /* ---------------------------------------------------------------- secret wingles */
  
  const secretWinglesReceived = useCallback<StoreValue['secretWinglesReceived']>(
    () => db.secretWingles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [db.secretWingles]
  );

  const sendSecretWingle = useCallback<StoreValue['sendSecretWingle']>(
    async (targetPhone, message) => {
      const { sendSecretWingleAction } = await import('@/app/actions/wingle');
      const res = await sendSecretWingleAction(targetPhone, message);
      if (res.ok && res.data) {
        // We do not add it to our local db since we are the sender and the SecretWingles tab is for received ones.
        // Wait, if there was a "sent" view, we would add it. For now just return ok.
        return { ok: true, data: res.data as any };
      }
      return { ok: false, error: res.error || 'Failed to send' };
    },
    []
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
    (conversationId, body, imageUrl, replyToId, forwarded, viewOnce) => {
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
        deliveredAt: null,
        deleted: false,
        replyToId: replyToId || null,
        forwarded: forwarded || false,
        reactions: null,
        deletedFor: [],
        viewOnce: viewOnce || false
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
      sendMingleAction(conversationId, body.trim(), imageUrl, replyToId, forwarded, viewOnce).then((res) => {
        if (res.ok && res.data) {
          setDb((d) => ({
            ...d,
            mingles: d.mingles.map((m) => m.id === mingle.id ? (res.data as unknown as Mingle) : m)
          }));
        }
      }).catch(console.error);

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
      } else if (remainingAfter !== null && remainingAfter === 1) {
        notify({
          userId: currentUser.id,
          type: 'chat_limit_warning',
          title: '1 mingle left',
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
          if (conn) {
            conn.on('open', () => {
              conn.send({ type: 'mingle', mingle });
              
            });
          }
        } catch (err) {
          console.error("PeerJS connect error", err);
        }
      }
      return { ok: true, data: mingle };
    },
    [currentUser, db.conversations, entitlements, notify]
  );

  const markConversationRead = useCallback<StoreValue['markConversationRead']>((conversationId) => {
    setDb((d) => {
      let changed = false;
      const now = new Date().toISOString();
      const nextMingles = d.mingles.map((m) => {
        if (m.conversationId === conversationId && m.senderId !== sessionIdRef.current && !m.readAt) {
          changed = true;
          return { ...m, readAt: now };
        }
        return m;
      });

      if (changed) {
        setTimeout(() => {
          markConversationReadAction(conversationId).catch(console.error);
          const conversation = d.conversations.find((c) => c.id === conversationId);
          const otherId = conversation?.userIds.find((uid) => uid !== sessionIdRef.current);
          if (otherId && peerRef.current) {
            try {
              const conn = peerRef.current.connect(otherId, { reliable: true });
              if (conn) {
                conn.on('open', () => {
                  conn.send({ type: 'read_receipt', conversationId, readAt: now });
                  
                });
              }
            } catch (err) {
              console.error("PeerJS read receipt error", err);
            }
          }
        }, 0);
        return { ...d, mingles: nextMingles };
      }

      return d;
    });
  }, []);
  const deleteMingle = useCallback<StoreValue['deleteMingle']>((mingleId, type) => {
    const targetMingle = db.mingles.find(m => m.id === mingleId);
    let otherId: string | undefined;
    if (targetMingle) {
      const conv = db.conversations.find(c => c.id === targetMingle.conversationId);
      otherId = conv?.userIds.find(uid => uid !== sessionIdRef.current);
    }
    
    if (type === 'everyone') {
      setDb((d) => ({
        ...d,
        mingles: d.mingles.map((m) =>
        m.id === mingleId ? { ...m, deleted: true, body: '', imageUrl: undefined, reactions: null } : m
        )
      }));
    } else {
      setDb((d) => ({
        ...d,
        mingles: d.mingles.map((m) =>
          m.id === mingleId ? { ...m, deletedFor: [...(m.deletedFor || []), sessionIdRef.current!] } : m
        )
      }));
    }
    
    import('@/app/actions/chat').then(({ deleteMingleAction }) => {
      deleteMingleAction(mingleId, type).catch(console.error);
    });

    if (otherId && peerRef.current) {
      try {
        const conn = peerRef.current.connect(otherId, { reliable: true });
        if (conn) {
          conn.on('open', () => {
            conn.send({ type: 'delete_mingle', mingleId, deleteType: type });
            
          });
        }
      } catch (err) {
        console.error("PeerJS connect error", err);
      }
    }
  }, [db.mingles, db.conversations]);

  const reactToMingle = useCallback<StoreValue['reactToMingle']>((mingleId, emoji) => {
    if (!sessionIdRef.current) return;
    setDb((d) => {
      const mingle = d.mingles.find(m => m.id === mingleId);
      if (!mingle) return d;
      
      const reactions = mingle.reactions || {};
      const emojiUsers = reactions[emoji] || [];
      const isReacted = emojiUsers.includes(sessionIdRef.current!);
      
      const newEmojiUsers = isReacted 
        ? emojiUsers.filter((id: string) => id !== sessionIdRef.current)
        : [...emojiUsers, sessionIdRef.current!];
        
      const newReactions = { ...reactions, [emoji]: newEmojiUsers };
      if (newReactions[emoji].length === 0) delete newReactions[emoji];
      
      setTimeout(() => {
        import('@/app/actions/chat').then(({ reactToMingleAction }) => {
          reactToMingleAction(mingleId, newReactions).catch(console.error);
        });
        const conv = d.conversations.find(c => c.id === mingle.conversationId);
        const otherId = conv?.userIds.find(uid => uid !== sessionIdRef.current);

        if (otherId && peerRef.current) {
          try {
            const conn = peerRef.current.connect(otherId, { reliable: true });
            if (conn) {
              conn.on('open', () => {
                conn.send({ type: 'react_mingle', mingleId, reactions: newReactions });
                
              });
            }
          } catch (err) {
            console.error("PeerJS connect error", err);
          }
        }
      }, 0);

      return {
        ...d,
        mingles: d.mingles.map(m => m.id === mingleId ? { ...m, reactions: newReactions } : m)
      };
    });
  }, []);

  const forwardMingles = useCallback<StoreValue['forwardMingles']>((mingleIds, conversationIds) => {
    if (!sessionIdRef.current) return;
    const minglesToForward = db.mingles.filter(m => mingleIds.includes(m.id));
    if (minglesToForward.length === 0) return;

    conversationIds.forEach(convId => {
      minglesToForward.forEach(m => {
        sendMingle(convId, m.body, m.imageUrl || undefined, undefined, true);
      });
    });
  }, [db.mingles, sendMingle]);

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
    import('@/app/actions/user').then(({ suspendUserAction }) => {
      suspendUserAction(userId, suspended).catch(console.error);
    });
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
    import('@/app/actions/admin').then(({ deleteUserAction }) => {
      deleteUserAction(userId).catch(console.error);
    });
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
    unlikeUser,
    passUser,
    hasLiked,
    likesReceived,
    unreadLikesCount,
    markLikesViewed,
    heartBucketOf,
    addToHeartBucket,
    removeFromHeartBucket,
    unreadHeartBucketCount,
    markHeartBucketViewed,
    brokenHeartOf,
    removeFromPasses,
    unreadBrokenHeartCount,
    markBrokenHeartViewed,
    sendWingle,
    respondToWingle,
    sentWingles,
    incomingWingles,
    unreadWinglesCount,
    markWinglesViewed,
    wingleStatusWith,
    secretWinglesReceived,
    sendSecretWingle,
    conversationsOf,
    conversationWith,
    ensureConversation,
    minglesOf,
    sendMingle,
    markConversationRead,
    deleteMingle,
    reactToMingle,
    forwardMingles,
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
    deleteStatus,
    isHydrated
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export { DEMO_USER_ID, ADMIN_USER_ID };