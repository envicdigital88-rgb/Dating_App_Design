'use server'

import crypto from 'node:crypto'
import { db } from '@/lib/db'
import { getSession, deleteSession } from '@/lib/session'
import { and, or } from '@prisma/orm-postgres/orm-client'
import { getPhoneVariants } from '@/lib/notify'
import type { Photo, User } from '@/lib/types'

export async function getCurrentUser() {
  try {
    const session = await getSession()
    if (!session?.userId) return null

    let user = await db.orm.public.User.where({ id: session.userId as string })
      .include('prompts')
      .include('photos')
      .first()
    console.log('getCurrentUser user found:', !!user)
    if (!user) return null

    const now = new Date();
    const lastBonus = user.lastDailyBonusAt ? new Date(user.lastDailyBonusAt.toString()) : null;
    if (!lastBonus || lastBonus.toDateString() !== now.toDateString()) {
      const { Temporal } = await import('temporal-polyfill');
      await db.orm.public.User.where({ id: user.id }).update({
        wingitsBalance: user.wingitsBalance + 1,
        lastDailyBonusAt: Temporal.Instant.from(now.toISOString())
      });
      await db.orm.public.WingitsTransaction.create({
        userId: user.id,
        amount: 1,
        type: 'bonus',
        description: 'Daily Login Bonus'
      });
      user.wingitsBalance += 1;
      user.lastDailyBonusAt = now.toISOString() as any;
    }

    // Ensure plain object for Next.js Client Components (Prisma 8 Temporal serialization)
    const parsedLifestyle = typeof user.lifestyle === 'string' ? (() => {
      try { return JSON.parse(user.lifestyle); } catch { return {}; }
    })() : (user.lifestyle || {});

    const isBoosted = Boolean(
      parsedLifestyle?.boostedUntil && new Date(parsedLifestyle.boostedUntil).getTime() > Date.now()
    );

    const selfieUrl = user.verificationSelfie
      ? (user.verificationSelfie.startsWith('data:') ? `/api/selfie/${user.id}` : user.verificationSelfie)
      : null;

    const { password, pushSubscription, ...safeUser } = user;
    return {
      ...safeUser,
      verificationSelfie: selfieUrl,
      lastActiveAt: user.lastActiveAt?.toString() || new Date().toISOString(),
      createdAt: user.createdAt?.toString() || new Date().toISOString(),
      lastDailyBonusAt: user.lastDailyBonusAt?.toString() || null,
      interests: typeof user.interests === 'string' ? JSON.parse(user.interests) : user.interests,
      traits: typeof user.traits === 'string' ? JSON.parse(user.traits) : user.traits,
      lifestyle: parsedLifestyle,
      boostedUntil: parsedLifestyle?.boostedUntil || null,
      isBoosted,
      photos: user.photos?.map((p: any) => ({
        ...p,
        url: p.url?.startsWith('data:') ? `/api/photo/${p.id}` : p.url,
        uploadedAt: p.uploadedAt?.toString() || new Date().toISOString()
      }))
    }
  } catch (err) {
    console.error('getCurrentUser error:', err)
    return null
  }
}

export async function getUserProfile(userId: string) {
  try {
    const session = await getSession();
    if (typeof session?.userId !== 'string') return { status: 'unavailable' as const };
    const viewerId = session.userId;
    if (viewerId === userId) return { status: 'self' as const };

    const [viewer, user, blocked] = await Promise.all([
      db.orm.public.User.select('phone', 'suspended').first({ id: viewerId }),
      db.orm.public.User.select(
        'id', 'name', 'age', 'location', 'bio', 'intention', 'interests', 'traits', 'lifestyle',
        'verified', 'isUnlimited', 'selfieStatus', 'isAnonymous', 'anonymousName',
        'online', 'lastActiveAt', 'showOnline', 'discoverable', 'onboarded', 'suspended', 'role'
      ).first({ id: userId }),
      db.orm.public.Block.where(b => or(
        and(b.blockerId.eq(viewerId), b.blockedUserId.eq(userId)),
        and(b.blockerId.eq(userId), b.blockedUserId.eq(viewerId))
      )).first(),
    ]);
    if (!viewer || viewer.suspended || !user || user.suspended || blocked || user.role !== 'member') {
      return { status: 'unavailable' as const };
    }

    const onDiscover = user.onboarded && user.discoverable && (user.isUnlimited || user.selfieStatus === 'approved');
    if (!onDiscover) {
      const phones = getPhoneVariants(viewer.phone);
      const relationships = await Promise.all([
        db.orm.public.Wingle.where(w => or(
          and(w.fromUserId.eq(viewerId), w.toUserId.eq(userId)),
          and(w.fromUserId.eq(userId), w.toUserId.eq(viewerId))
        )).first(),
        db.orm.public.Like.where(l => or(
          and(l.fromUserId.eq(viewerId), l.toUserId.eq(userId)),
          and(l.fromUserId.eq(userId), l.toUserId.eq(viewerId))
        )).first(),
        db.orm.public.HeartBucket.where(h => or(
          and(h.userId.eq(viewerId), h.targetUserId.eq(userId)),
          and(h.userId.eq(userId), h.targetUserId.eq(viewerId))
        )).first(),
        db.orm.public.Pass.where({ userId: viewerId, targetUserId: userId }).first(),
        phones.length > 0 ? db.orm.public.SecretWingle.where({ senderId: userId })
          .where(w => w.targetPhone.in(phones)).first() : null,
      ]);
      if (!relationships.some(Boolean)) return { status: 'unavailable' as const };
    }

    const [photos, prompts, hearts] = await Promise.all([
      user.isAnonymous ? [] : db.orm.public.Photo.where({ userId, moderation: 'approved' }).all(),
      user.isAnonymous ? [] : db.orm.public.Prompt.select('id', 'question', 'answer').where({ userId }).all(),
      db.orm.public.HeartBucket.where({ targetUserId: userId }).aggregate(a => ({ count: a.count() })).then(result => result.count),
    ]);
    const parseList = (raw: string): string[] => {
      try {
        const list: unknown = JSON.parse(raw);
        return Array.isArray(list) ? list.filter(item => typeof item === 'string') : [];
      } catch { return []; }
    };
    const lifestyle: User['lifestyle'] = { drinking: '', smoking: '', exercise: '', pets: '', children: '', education: '', work: '' };
    if (!user.isAnonymous) {
      try {
        const saved = JSON.parse(user.lifestyle);
        for (const key of Object.keys(lifestyle) as (keyof typeof lifestyle)[]) {
          if (typeof saved?.[key] === 'string') lifestyle[key] = saved[key];
        }
      } catch {}
    }
    return {
      status: 'ready' as const,
      user: {
        id: user.id,
        name: user.isAnonymous ? user.anonymousName || 'Anonymous' : user.name,
        age: user.isAnonymous ? 0 : user.age,
        location: user.isAnonymous ? 'Hidden' : user.location,
        bio: user.isAnonymous ? '' : user.bio,
        interests: user.isAnonymous ? [] : parseList(user.interests),
        traits: user.isAnonymous ? [] : parseList(user.traits),
        lifestyle,
        intention: user.intention as User['intention'],
        verified: user.verified,
        isUnlimited: user.isUnlimited,
        selfieStatus: user.selfieStatus,
        isAnonymous: user.isAnonymous,
        online: user.showOnline && user.online,
        lastActiveAt: user.showOnline ? user.lastActiveAt.toString() : '',
        heartReacts: hearts,
        prompts,
      },
      photos: photos.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.order - b.order).map((photo): Photo => ({
        id: photo.id,
        userId: photo.userId,
        url: photo.url.startsWith('data:') ? `/api/photo/${photo.id}` : photo.url,
        order: photo.order,
        isPrimary: photo.isPrimary,
        moderation: 'approved',
        uploadedAt: photo.uploadedAt.toString(),
      })),
    };
  } catch (err) {
    console.error('Could not load member profile:', err);
    return { status: 'error' as const };
  }
}

export async function deleteUserProfile() {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    await db.orm.public.User.where({ id: session.userId as string }).delete()
    await deleteSession()
    return { ok: true }
  } catch (err) {
    console.error('Delete profile error:', err)
    return { ok: false, error: 'Failed to delete profile' }
  }
}

export async function suspendUserAction(targetUserId: string, suspended: boolean, reason?: string) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    // Verify caller is admin
    const caller = await db.orm.public.User.where({ id: session.userId as string }).first()
    if (!caller || caller.role !== 'admin') {
      return { ok: false, error: 'Forbidden' }
    }

    await db.orm.public.User.where({ id: targetUserId }).update({
      suspended,
      suspensionReason: suspended ? (reason?.trim() || 'Account suspended by administrator.') : null
    })
    return { ok: true }
  } catch (err) {
    console.error('Suspend user error:', err)
    return { ok: false, error: 'Failed to update suspension status' }
  }
}

export interface DiscoverFilters {
  ageMin: number;
  ageMax: number;
  gender: string;
  intention: string;
  onlineOnly: boolean;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function getDiscoverUsers(filters?: DiscoverFilters, seenIds: string[] = []) {
  console.log('getDiscoverUsers START');
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized', data: [] };
    const userId = session.userId as string;

    // Fetch current user to determine their gender for discover preference
    const currentUser = await db.orm.public.User.where({ id: userId }).first();
    const myGender = (currentUser?.gender || '').toLowerCase();
    const preferredOppositeGender = myGender === 'man' ? 'woman' : myGender === 'woman' ? 'man' : null;
    
    const likes = await db.orm.public.Like.where({ fromUserId: userId }).all();
    const passes = await db.orm.public.Pass.where({ userId }).all();
    const heartBucket = await db.orm.public.HeartBucket.where({ userId }).all();
    const blocks = await db.orm.public.Block.where((b) => or(b.blockerId.eq(userId), b.blockedUserId.eq(userId))).all();
    
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const recentPasses = passes.filter((p: any) => p.createdAt && new Date(p.createdAt.toString()) >= tenDaysAgo);

    const excludedIds = [
      userId,
      ...likes.map((l: any) => l.toUserId),
      ...recentPasses.map((p: any) => p.targetUserId),
      ...heartBucket.map((h: any) => h.targetUserId),
      ...blocks.map((b: any) => b.blockerId === userId ? b.blockedUserId : b.blockerId),
      ...seenIds
    ];
    
    // Fetch all active, onboarded member users
    const rawUsers = await db.orm.public.User.where({
      onboarded: true,
      role: 'member',
      suspended: false
    }).all();
    
    const excludedSet = new Set(excludedIds);
    let eligible = rawUsers.filter(u => {
      if (excludedSet.has(u.id)) return false;
      if (u.discoverable === false) return false;
      // Unlimited accounts are always public and photo verified
      if (u.isUnlimited) return true;
      // Must have been approved for selfie verification to appear on Discover
      if (u.selfieStatus !== 'approved') return false;
      return true;
    });

    if (filters) {
      eligible = eligible.filter(u => {
        if (filters.ageMin !== undefined && u.age < filters.ageMin) return false;
        if (filters.ageMax !== undefined && u.age > filters.ageMax) return false;
        if (filters.intention && filters.intention !== 'any' && u.intention !== filters.intention) return false;
        if (filters.onlineOnly) {
          const lastActive = u.lastActiveAt ? new Date(u.lastActiveAt.toString()).getTime() : 0;
          const tenMinsAgo = Date.now() - 10 * 60 * 1000;
          if (lastActive < tenMinsAgo) return false;
        }
        return true;
      });
    }

    // Graceful fallback: If eligible is empty because user passed all profiles or exhausted queue, recycle passed profiles (never liked/hearted/blocked)
    if (eligible.length === 0 && (passes.length > 0 || seenIds.length > 0)) {
      const hardExcludedIds = new Set([
        userId,
        ...likes.map((l: any) => l.toUserId),
        ...heartBucket.map((h: any) => h.targetUserId),
        ...blocks.map((b: any) => b.blockerId === userId ? b.blockedUserId : b.blockerId),
      ]);
      eligible = rawUsers.filter(u => {
        if (hardExcludedIds.has(u.id)) return false;
        if (u.discoverable === false) return false;
        if (u.isUnlimited) return true;
        if (u.selfieStatus !== 'approved') return false;
        return true;
      });
      if (filters) {
        eligible = eligible.filter(u => {
          if (filters.ageMin !== undefined && u.age < filters.ageMin) return false;
          if (filters.ageMax !== undefined && u.age > filters.ageMax) return false;
          if (filters.intention && filters.intention !== 'any' && u.intention !== filters.intention) return false;
          if (filters.onlineOnly) {
            const lastActive = u.lastActiveAt ? new Date(u.lastActiveAt.toString()).getTime() : 0;
            const tenMinsAgo = Date.now() - 10 * 60 * 1000;
            if (lastActive < tenMinsAgo) return false;
          }
          return true;
        });
      }
    }

    const BATCH_SIZE = 20;
    let selectedUsers: typeof rawUsers = [];

    if (filters?.gender && filters.gender !== 'any') {
      // User explicitly set a gender filter: strictly respect it and randomize
      const genderFiltered = eligible.filter(u => u.gender?.toLowerCase() === filters.gender.toLowerCase());
      selectedUsers = shuffleArray(genderFiltered).slice(0, BATCH_SIZE);
    } else if (preferredOppositeGender) {
      // Default: Male user -> mostly women; Female user -> mostly men
      const preferredPool = eligible.filter(u => u.gender?.toLowerCase() === preferredOppositeGender);
      const otherPool = eligible.filter(u => u.gender?.toLowerCase() !== preferredOppositeGender);

      const shuffledPreferred = shuffleArray(preferredPool);
      const shuffledOthers = shuffleArray(otherPool);

      let p = 0;
      let o = 0;

      // Distribute with majority opposite gender (e.g. 5 preferred to 1 other, ~83% preferred)
      while (selectedUsers.length < BATCH_SIZE && (p < shuffledPreferred.length || o < shuffledOthers.length)) {
        for (let k = 0; k < 5 && selectedUsers.length < BATCH_SIZE && p < shuffledPreferred.length; k++) {
          selectedUsers.push(shuffledPreferred[p++]);
        }
        if (selectedUsers.length < BATCH_SIZE && o < shuffledOthers.length) {
          selectedUsers.push(shuffledOthers[o++]);
        }
        if (p >= shuffledPreferred.length && o < shuffledOthers.length && selectedUsers.length < BATCH_SIZE) {
          selectedUsers.push(shuffledOthers[o++]);
        }
        if (o >= shuffledOthers.length && p < shuffledPreferred.length && selectedUsers.length < BATCH_SIZE) {
          selectedUsers.push(shuffledPreferred[p++]);
        }
      }
    } else {
      // Non-binary or unknown gender: randomize all eligible
      selectedUsers = shuffleArray(eligible).slice(0, BATCH_SIZE);
    }

    // Sort active Spotlight Boosted users to the very top (1st place)
    const isUserBoosted = (u: any) => {
      try {
        const ls = typeof u.lifestyle === 'string' ? JSON.parse(u.lifestyle || '{}') : (u.lifestyle || {});
        return Boolean(ls?.boostedUntil && new Date(ls.boostedUntil).getTime() > Date.now());
      } catch {
        return false;
      }
    };

    const boostedInEligible = eligible.filter(isUserBoosted);
    const nonBoostedSelected = selectedUsers.filter(u => !isUserBoosted(u));
    selectedUsers = Array.from(new Set([...boostedInEligible, ...nonBoostedSelected])).slice(0, BATCH_SIZE);

    const userIds = selectedUsers.map(u => u.id);

    if (userIds.length === 0) return { ok: true, data: [] };

    // Fetch photos and heartReacts in parallel - NO prompts in initial load
    const photos = await db.orm.public.Photo.where((p) => p.userId.in(userIds)).all();
    const heartReactsRaw = await db.orm.public.HeartBucket.where((h) => h.targetUserId.in(userIds)).all();

    const heartReactsMap = new Map();
    if (Array.isArray(heartReactsRaw)) {
      heartReactsRaw.forEach((c: any) => {
        heartReactsMap.set(c.targetUserId, (heartReactsMap.get(c.targetUserId) || 0) + 1);
      });
    }

    const mappedUsers = selectedUsers.map((user: any) => {
      const realCount = heartReactsMap.get(user.id) || 0;
      const fakeCount = ((user.id.charCodeAt(0) + user.id.charCodeAt(user.id.length - 1)) % 50) + 1;

      // Exclude sensitive credentials and private push notification keys
      const { password, pushSubscription, verificationSelfie, email, phone, ...safeUser } = user;

      return {
        ...safeUser,
        verificationSelfie: verificationSelfie
          ? (verificationSelfie.startsWith('data:') ? `/api/selfie/${user.id}` : verificationSelfie)
          : null,
        lastActiveAt: user.lastActiveAt?.toString() || new Date().toISOString(),
        createdAt: user.createdAt?.toString() || new Date().toISOString(),
        lastDailyBonusAt: user.lastDailyBonusAt?.toString() || null,
        interests: typeof user.interests === 'string' ? JSON.parse(user.interests) : (user.interests || []),
        traits: typeof user.traits === 'string' ? JSON.parse(user.traits) : (user.traits || []),
        lifestyle: typeof user.lifestyle === 'string' ? JSON.parse(user.lifestyle) : (user.lifestyle || {}),
        boostedUntil: (() => {
          try {
            const ls = typeof user.lifestyle === 'string' ? JSON.parse(user.lifestyle || '{}') : (user.lifestyle || {});
            return ls?.boostedUntil || null;
          } catch { return null; }
        })(),
        isBoosted: (() => {
          try {
            const ls = typeof user.lifestyle === 'string' ? JSON.parse(user.lifestyle || '{}') : (user.lifestyle || {});
            return Boolean(ls?.boostedUntil && new Date(ls.boostedUntil).getTime() > Date.now());
          } catch { return false; }
        })(),
        photos: photos
          .filter(p => p.userId === user.id && p.moderation === 'approved')
          .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || a.order - b.order)
          .map((p: any) => ({
            id: p.id,
            userId: p.userId,
            url: p.url.startsWith('data:') ? `/api/photo/${p.id}` : p.url,
            order: p.order,
            isPrimary: p.isPrimary,
            moderation: p.moderation,
            uploadedAt: p.uploadedAt?.toString() || new Date().toISOString()
          })),
        prompts: [], // Loaded lazily on profile open
        heartReacts: realCount > 0 ? realCount : fakeCount
      };
    });
    console.log('getDiscoverUsers END, count:', mappedUsers.length);
    return { ok: true, data: mappedUsers };
  } catch (err) {
    console.log('getDiscoverUsers ERROR', err);
    console.error('getDiscoverUsers error:', err);
    return { ok: false, error: 'Failed to fetch discover users', data: [] };
  }
}

export async function getUserPromptsAction(userId: string) {
  try {
    const prompts = await db.orm.public.Prompt.where({ userId }).all();
    return { ok: true, data: prompts };
  } catch (err) {
    return { ok: false, error: 'Failed to fetch prompts' };
  }
}

export async function updateUserProfileAction(data: {
  name?: string;
  age?: number;
  bio?: string;
  location?: string;
  interests?: string[];
  traits?: string[];
  lifestyle?: Record<string, string>;
  photoUrls?: string[];
  prompts?: { question: string; answer: string }[];
}) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const userId = session.userId as string;

    const { photoUrls, prompts, ...userData } = data;

    const updatePayload: Record<string, any> = {};
    if (userData.name !== undefined) updatePayload.name = userData.name;
    if (userData.age !== undefined) updatePayload.age = userData.age;
    if (userData.bio !== undefined) updatePayload.bio = userData.bio;
    if (userData.location !== undefined) updatePayload.location = userData.location;
    if (userData.interests !== undefined) updatePayload.interests = JSON.stringify(userData.interests);
    if (userData.traits !== undefined) updatePayload.traits = JSON.stringify(userData.traits);
    if (userData.lifestyle !== undefined) updatePayload.lifestyle = JSON.stringify(userData.lifestyle);

    if (Object.keys(updatePayload).length > 0) {
      await db.orm.public.User.where({ id: userId }).update(updatePayload);
    }

    if (photoUrls && photoUrls.length > 0) {
      await db.orm.public.Photo.where({ userId }).delete();
      for (let index = 0; index < photoUrls.length; index++) {
        await db.orm.public.Photo.create({
          userId, url: photoUrls[index], order: index, isPrimary: index === 0, moderation: 'approved',
        });
      }
    }

    if (prompts && prompts.length > 0) {
      await db.orm.public.Prompt.where({ userId }).delete();
      for (const p of prompts) {
        await db.orm.public.Prompt.create({
          userId, question: p.question, answer: p.answer,
        });
      }
    }

    const updatedUser = await db.orm.public.User.where({ id: userId }).include('photos').include('prompts').first();
    if (!updatedUser) return { ok: false, error: 'User not found' };

    return {
      ok: true,
      data: {
        ...updatedUser,
        verificationSelfie: updatedUser.verificationSelfie
          ? (updatedUser.verificationSelfie.startsWith('data:') ? `/api/selfie/${updatedUser.id}` : updatedUser.verificationSelfie)
          : null,
        lastActiveAt: updatedUser.lastActiveAt?.toString() || new Date().toISOString(),
        createdAt: updatedUser.createdAt?.toString() || new Date().toISOString(),
        interests: typeof updatedUser.interests === 'string' ? JSON.parse(updatedUser.interests) : (updatedUser.interests || []),
        traits: typeof updatedUser.traits === 'string' ? JSON.parse(updatedUser.traits) : (updatedUser.traits || []),
        lifestyle: typeof updatedUser.lifestyle === 'string' ? JSON.parse(updatedUser.lifestyle) : (updatedUser.lifestyle || {}),
        photos: (updatedUser.photos || []).map((p: any) => ({
          ...p,
          url: p.url?.startsWith('data:') ? `/api/photo/${p.id}` : p.url,
          uploadedAt: p.uploadedAt?.toString() || new Date().toISOString()
        })),
      }
    };
  } catch (err) {
    console.error('updateUserProfileAction error:', err);
    return { ok: false, error: 'Failed to update profile' };
  }
}

export async function completeUserOnboarding(data: Pick<User, 'age' | 'gender' | 'location' | 'bio' | 'intention' | 'lifestyle' | 'interests' | 'traits' | 'verificationSelfie'> & {
  photoUrls: string[];
  prompts: { question: string; answer: string }[];
}) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const { photoUrls, prompts, verificationSelfie, age, gender, location, bio, intention, lifestyle, interests, traits } = data;
    const userId = session.userId as string;

    // Stringify JSON fields because they are stored as text in DB
    const updatePayload = {
      age,
      gender,
      location,
      bio,
      intention,
      verificationSelfie: verificationSelfie || null,
      selfieStatus: verificationSelfie ? 'pending' : null,
      onboarded: true,
      lifestyle: JSON.stringify(lifestyle || {}),
      interests: JSON.stringify(interests || []),
      traits: JSON.stringify(traits || [])
    };

    // Update user profile and set onboarded = true
    await db.orm.public.User.where({ id: userId }).update(updatePayload);

    // Handle prompts
    if (prompts && prompts.length > 0) {
      await db.orm.public.Prompt.where({ userId }).delete();
      const promptsToInsert = prompts.map(p => ({
        userId,
        question: p.question,
        answer: p.answer
      }));
      // Prisma 8 array insert
      if (promptsToInsert.length > 0) {
        for (const prompt of promptsToInsert) {
          await db.orm.public.Prompt.create(prompt);
        }
      }
    }

    // Handle photos
    if (photoUrls && photoUrls.length > 0) {
      await db.orm.public.Photo.where({ userId }).delete();
      const photosToInsert = photoUrls.map((url: string, index: number) => ({
        userId,
        url,
        order: index,
        isPrimary: index === 0,
        moderation: 'approved',
        // Omitting uploadedAt as the DB handles it with a default expression
      }));
      for (const photo of photosToInsert) {
        await db.orm.public.Photo.create(photo);
      }
    }

    return { ok: true }
  } catch (err) {
    console.error('Onboarding error:', err)
    return { ok: false, error: 'Failed to complete onboarding' }
  }
}

export async function getUserStateAction() {
  console.log('getUserStateAction START');
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string
    
    const [likes, passes, heartBucket, wingles, rawConnections, blocks, userNotifications, currentUserRecord] = await Promise.all([
      db.orm.public.Like.where(l => or(l.fromUserId.eq(userId), l.toUserId.eq(userId))).all(),
      db.orm.public.Pass.where(p => or(p.userId.eq(userId), p.targetUserId.eq(userId))).all(),
      db.orm.public.HeartBucket.where(h => or(h.userId.eq(userId), h.targetUserId.eq(userId))).all(),
      db.orm.public.Wingle.where(w => or(w.fromUserId.eq(userId), w.toUserId.eq(userId))).all(),
      db.orm.public.Connection.where(c => or(c.userId1.eq(userId), c.userId2.eq(userId))).all(),
      db.orm.public.Block.where(b => or(b.blockerId.eq(userId), b.blockedUserId.eq(userId))).all(),
      db.orm.public.Notification.where({ userId }).all(),
      db.orm.public.User.select('wingitsBalance', 'isUnlimited', 'verificationSelfie', 'selfieStatus').first({ id: userId }),
    ]);
    const acceptedPeerIds = new Set(wingles.filter(w => w.status === 'accepted')
      .map(w => w.fromUserId === userId ? w.toUserId : w.fromUserId));
    const connections = rawConnections
      .filter(c => acceptedPeerIds.has(c.userId1 === userId ? c.userId2 : c.userId1));
    let notifications = userNotifications;

    if (currentUserRecord && !currentUserRecord.isUnlimited && (!currentUserRecord.verificationSelfie || currentUserRecord.selfieStatus !== 'approved')) {
      const hasSelfieNotif = notifications.some((n: any) => n.type === 'selfie_verification' || n.href === '/verify-selfie');
      if (!hasSelfieNotif) {
        try {
          const newNotif = await db.orm.public.Notification.create({
            userId,
            type: 'selfie_verification',
            title: 'Selfie Verification Required 📸',
            body: 'Complete your quick live selfie to activate your account, show up on Discover, and send Wingles!',
            href: '/verify-selfie'
          });
          notifications = [newNotif, ...notifications];
        } catch (e) {
          console.warn('Failed to ensure selfie notification:', e);
        }
      }
    }

    const relatedUserIds = new Set<string>();
    likes.forEach(l => { relatedUserIds.add(l.fromUserId); relatedUserIds.add(l.toUserId); });
    passes.forEach(p => { relatedUserIds.add(p.userId); relatedUserIds.add(p.targetUserId); });
    heartBucket.forEach(h => { relatedUserIds.add(h.userId); relatedUserIds.add(h.targetUserId); });
    wingles.forEach(w => { relatedUserIds.add(w.fromUserId); relatedUserIds.add(w.toUserId); });
    connections.forEach(c => { relatedUserIds.add(c.userId1); relatedUserIds.add(c.userId2); });
    relatedUserIds.delete(userId);

    let relatedUsers: any[] = [];
    if (relatedUserIds.size > 0) {
      const uIds = Array.from(relatedUserIds);
      const [rUsers, rPhotos] = await Promise.all([
        db.orm.public.User.where(u => u.id.in(uIds)).all(),
        db.orm.public.Photo.where({ moderation: 'approved' }).where(p => p.userId.in(uIds)).all(),
      ]);
      relatedUsers = rUsers.map((u: any) => ({
        ...u,
        photos: rPhotos.filter(p => p.userId === u.id)
      }));
    }

    const mappedRelatedUsers = relatedUsers.map((user: any) => {
      const parsedLifestyle = typeof user.lifestyle === 'string' ? (() => {
        try { return JSON.parse(user.lifestyle); } catch { return {}; }
      })() : (user.lifestyle || {});
      const isBoosted = Boolean(
        parsedLifestyle?.boostedUntil && new Date(parsedLifestyle.boostedUntil).getTime() > Date.now()
      );
      return {
        id: user.id,
        name: user.name,
        age: user.age,
        gender: user.gender,
        location: user.location,
        bio: user.bio || '',
        verified: Boolean(user.verified),
        isUnlimited: Boolean(user.isUnlimited),
        selfieStatus: user.selfieStatus || null,
        lastActiveAt: user.lastActiveAt ? user.lastActiveAt.toString() : new Date().toISOString(),
        createdAt: user.createdAt ? user.createdAt.toString() : new Date().toISOString(),
        lastDailyBonusAt: user.lastDailyBonusAt?.toString() || null,
        interests: typeof user.interests === 'string' ? (() => { try { return JSON.parse(user.interests); } catch { return []; } })() : (user.interests || []),
        traits: typeof user.traits === 'string' ? (() => { try { return JSON.parse(user.traits); } catch { return []; } })() : (user.traits || []),
        lifestyle: parsedLifestyle,
        boostedUntil: parsedLifestyle?.boostedUntil || null,
        isBoosted,
        photos: (user.photos || []).map((p: any) => ({
          id: p.id,
          userId: p.userId,
          url: p.url?.startsWith('data:') ? `/api/photo/${p.id}` : p.url,
          order: p.order,
          isPrimary: Boolean(p.isPrimary),
          moderation: p.moderation,
          uploadedAt: p.uploadedAt ? p.uploadedAt.toString() : new Date().toISOString()
        }))
      };
    });

    const payload = {
      wingitsBalance: currentUserRecord?.wingitsBalance,
      likes: likes.map(l => ({
        id: l.id,
        fromUserId: l.fromUserId,
        toUserId: l.toUserId,
        viewed: Boolean(l.viewed),
        createdAt: l.createdAt ? l.createdAt.toString() : new Date().toISOString()
      })),
      passes: passes.map(p => ({
        id: p.id,
        userId: p.userId,
        targetUserId: p.targetUserId,
        viewed: Boolean(p.viewed),
        createdAt: (p as any).createdAt ? (p as any).createdAt.toString() : new Date().toISOString()
      })),
      heartBucket: heartBucket.map(h => ({
        id: h.id,
        userId: h.userId,
        targetUserId: h.targetUserId,
        viewed: Boolean(h.viewed),
        createdAt: (h as any).createdAt ? (h as any).createdAt.toString() : new Date().toISOString()
      })),
      wingles: wingles.map(w => ({
        id: w.id,
        fromUserId: w.fromUserId,
        toUserId: w.toUserId,
        note: w.note || '',
        status: w.status,
        viewed: Boolean(w.viewed),
        createdAt: w.createdAt ? w.createdAt.toString() : new Date().toISOString(),
        respondedAt: w.respondedAt ? w.respondedAt.toString() : null
      })),
      connections: connections.map(c => ({
        id: c.id,
        userIds: [c.userId1, c.userId2],
        createdAt: c.createdAt ? c.createdAt.toString() : new Date().toISOString()
      })),
      blocks: blocks.map(b => ({
        id: b.id,
        blockerId: b.blockerId,
        blockedUserId: b.blockedUserId,
        createdAt: b.createdAt ? b.createdAt.toString() : new Date().toISOString()
      })),
      relatedUsers: mappedRelatedUsers,
      notifications: notifications.map(n => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        read: Boolean(n.read),
        href: n.href || null,
        createdAt: n.createdAt ? n.createdAt.toString() : new Date().toISOString()
      }))
    };

    console.log(`[getUserStateAction] Returning state for ${userId}: ${wingles.length} wingles, ${connections.length} connections, ${relatedUsers.length} related users`);
    console.log('getUserStateAction END');
    return { 
      ok: true, 
      data: payload
    }
  } catch (err) {
    console.log('getUserStateAction ERROR', err);
    console.error('getUserStateAction error:', err)
    return { ok: false, error: 'Failed to fetch user state' }
  }
}

export async function markNotificationReadAction(notificationId: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false };
    await db.orm.public.Notification.where({ id: notificationId, userId: session.userId as string }).update({ read: true });
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false };
    await db.orm.public.Notification.where({ userId: session.userId as string }).update({ read: true });
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false };
  }
}

export async function addPhotoAction(url: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const userId = session.userId as string;

    const existingCount = await db.orm.public.Photo.where({ userId }).aggregate(a => ({ count: a.count() })).then(r => r.count);
    const photo = await db.orm.public.Photo.create({
      userId,
      url,
      order: existingCount,
      isPrimary: existingCount === 0,
      moderation: 'pending',
    });

    return {
      ok: true,
      data: {
        ...photo,
        url: photo.url.startsWith('data:') ? `/api/photo/${photo.id}` : photo.url,
        uploadedAt: photo.uploadedAt.toString()
      }
    };
  } catch (err) {
    return { ok: false, error: 'Failed to add photo' };
  }
}

export async function deletePhotoAction(photoId: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    
    await db.orm.public.Photo.where({ id: photoId, userId: session.userId as string }).delete();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'Failed to delete photo' };
  }
}

export async function updatePhotosOrderAction(orderedPhotoIds: string[], primaryPhotoId: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    
    await Promise.all(orderedPhotoIds.map((id, index) => 
      db.orm.public.Photo.where({ id, userId: session.userId as string }).update({
        order: index,
        isPrimary: id === primaryPhotoId
      })
    ));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'Failed to update photos order' };
  }
}

export async function submitVerificationSelfieAction(verificationSelfie: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const userId = session.userId as string;

    await db.orm.public.User.where({ id: userId }).update({
      verificationSelfie,
      selfieStatus: 'pending'
    });

    return { ok: true };
  } catch (err) {
    console.error('Submit verification selfie error:', err);
    return { ok: false, error: 'Failed to submit verification selfie' };
  }
}



export async function boostUserProfileAction() {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };
    const userId = session.userId as string;

    const user = await db.orm.public.User.where({ id: userId }).first();
    if (!user) return { ok: false, error: 'User not found' };

    const BOOST_COST = 20;
    if (!user.isUnlimited && (user.wingitsBalance ?? 0) < BOOST_COST) {
      return {
        ok: false,
        error: `You need ${BOOST_COST} Wingits to activate 24-hour Profile Spotlight.`,
        reason: 'insufficient_wingits'
      };
    }

    const currentLifestyle = typeof user.lifestyle === 'string' ? JSON.parse(user.lifestyle || '{}') : (user.lifestyle || {});
    const currentBoostEnd = currentLifestyle.boostedUntil ? new Date(currentLifestyle.boostedUntil).getTime() : 0;
    const baseTime = currentBoostEnd > Date.now() ? currentBoostEnd : Date.now();
    const newBoostedUntil = new Date(baseTime + 24 * 60 * 60 * 1000).toISOString();

    const newLifestyle = {
      ...currentLifestyle,
      boostedUntil: newBoostedUntil
    };

    const newBalance = user.isUnlimited ? user.wingitsBalance : Math.max(0, user.wingitsBalance - BOOST_COST);

    await db.transaction(async (tx) => {
      await tx.orm.public.User.where({ id: userId }).update({
        lifestyle: JSON.stringify(newLifestyle),
        wingitsBalance: newBalance
      });

      if (!user.isUnlimited) {
        await tx.orm.public.WingitsTransaction.create({
          id: crypto.randomUUID(),
          userId,
          amount: -BOOST_COST,
          type: 'spend',
          description: 'Profile Spotlight Boost (24 Hours)'
        });
      }
    });

    return {
      ok: true,
      boostedUntil: newBoostedUntil,
      remainingBalance: newBalance
    };
  } catch (err: any) {
    console.error('boostUserProfileAction error:', err);
    return { ok: false, error: err?.message || 'Failed to boost profile' };
  }
}
