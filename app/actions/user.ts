'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { not, or } from '@prisma/orm-postgres/orm-client'

export async function getCurrentUser() {
  try {
    const session = await getSession()
    console.log('getCurrentUser session:', session)
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
    return {
      ...user,
      lastActiveAt: user.lastActiveAt?.toString() || new Date().toISOString(),
      createdAt: user.createdAt?.toString() || new Date().toISOString(),
      lastDailyBonusAt: user.lastDailyBonusAt?.toString() || null,
      interests: typeof user.interests === 'string' ? JSON.parse(user.interests) : user.interests,
      traits: typeof user.traits === 'string' ? JSON.parse(user.traits) : user.traits,
      lifestyle: typeof user.lifestyle === 'string' ? JSON.parse(user.lifestyle) : user.lifestyle,
      photos: user.photos?.map((p: any) => ({
        ...p,
        uploadedAt: p.uploadedAt?.toString() || new Date().toISOString()
      }))
    }
  } catch (err) {
    console.error('getCurrentUser error:', err)
    return null
  }
}

export async function getUserProfile(userId: string) {
  const user = await db.orm.public.User.where({ id: userId }).first()
  if (!user) return null;
  return {
    ...user,
    lastActiveAt: user.lastActiveAt?.toString() || new Date().toISOString(),
    createdAt: user.createdAt?.toString() || new Date().toISOString(),
    lastDailyBonusAt: user.lastDailyBonusAt?.toString() || null,
  };
}

export async function updateUserProfile(data: any) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const updatePayload = { ...data }
    if (updatePayload.lifestyle) updatePayload.lifestyle = JSON.stringify(updatePayload.lifestyle)
    if (updatePayload.interests) updatePayload.interests = JSON.stringify(updatePayload.interests)
    if (updatePayload.traits) updatePayload.traits = JSON.stringify(updatePayload.traits)

    await db.orm.public.User.where({ id: session.userId as string }).update(updatePayload)
    return { ok: true }
  } catch (err) {
    console.error('Update profile error:', err)
    return { ok: false, error: 'Failed to update profile' }
  }
}

export async function deleteUserProfile() {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    await db.orm.public.User.where({ id: session.userId as string }).delete()
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
    const recentPasses = passes.filter((p: any) => new Date(p.createdAt?.toString() || 0) >= tenDaysAgo);

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
      // Pending or rejected selfies are NOT public (private profile until approved)
      if (u.selfieStatus === 'pending' || u.selfieStatus === 'rejected') return false;
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

      return {
        ...user,
        lastActiveAt: user.lastActiveAt?.toString() || new Date().toISOString(),
        createdAt: user.createdAt?.toString() || new Date().toISOString(),
        lastDailyBonusAt: user.lastDailyBonusAt?.toString() || null,
        interests: typeof user.interests === 'string' ? JSON.parse(user.interests) : (user.interests || []),
        traits: typeof user.traits === 'string' ? JSON.parse(user.traits) : (user.traits || []),
        lifestyle: typeof user.lifestyle === 'string' ? JSON.parse(user.lifestyle) : (user.lifestyle || {}),
        photos: photos
          .filter(p => p.userId === user.id && p.moderation === 'approved')
          .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || a.order - b.order)
          .map((p: any) => ({
            ...p,
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
        lastActiveAt: updatedUser.lastActiveAt?.toString() || new Date().toISOString(),
        createdAt: updatedUser.createdAt?.toString() || new Date().toISOString(),
        interests: typeof updatedUser.interests === 'string' ? JSON.parse(updatedUser.interests) : (updatedUser.interests || []),
        traits: typeof updatedUser.traits === 'string' ? JSON.parse(updatedUser.traits) : (updatedUser.traits || []),
        lifestyle: typeof updatedUser.lifestyle === 'string' ? JSON.parse(updatedUser.lifestyle) : (updatedUser.lifestyle || {}),
        photos: (updatedUser.photos || []).map((p: any) => ({ ...p, uploadedAt: p.uploadedAt?.toString() || new Date().toISOString() })),
      }
    };
  } catch (err) {
    console.error('updateUserProfileAction error:', err);
    return { ok: false, error: 'Failed to update profile' };
  }
}

export async function completeUserOnboarding(data: any) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    const { photoUrls, prompts, verificationSelfie, ...userData } = data;
    const userId = session.userId as string;

    // Stringify JSON fields because they are stored as text in DB
    const updatePayload = {
      ...userData,
      verificationSelfie: verificationSelfie || null,
      selfieStatus: verificationSelfie ? 'pending' : null,
      onboarded: true,
      lifestyle: JSON.stringify(userData.lifestyle || {}),
      interests: JSON.stringify(userData.interests || []),
      traits: JSON.stringify(userData.traits || [])
    };

    // Update user profile and set onboarded = true
    await db.orm.public.User.where({ id: userId }).update(updatePayload);

    // Handle prompts
    if (prompts && prompts.length > 0) {
      await db.orm.public.Prompt.where({ userId }).delete();
      const promptsToInsert = prompts.map((p: any) => ({
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

export async function getDiscoverProfiles() {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string

    const likes = await db.orm.public.Like.where({ fromUserId: userId }).all()
    const passes = await db.orm.public.Pass.where({ userId }).all()
    const heartBucket = await db.orm.public.HeartBucket.where({ userId }).all()
    
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    const recentPasses = passes.filter((p: any) => new Date(p.createdAt) >= tenDaysAgo);

    const excludedIds = [
      userId,
      ...likes.map((l: any) => l.toUserId),
      ...recentPasses.map((p: any) => p.targetUserId),
      ...heartBucket.map((h: any) => h.targetUserId)
    ]

    const users = await db.orm.public.User.where(
      (u) => not(u.id.in(excludedIds))
    ).limit(300).all()
    
    // In a real app we'd map this, fetch photos, and calculate vibe match score here.
    return { ok: true, data: users }
  } catch (err) {
    console.error('Discover profiles error:', err)
    return { ok: false, error: 'Failed to fetch profiles' }
  }
}

export async function getUserStateAction() {
  console.log('getUserStateAction START');
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }
    const userId = session.userId as string
    
    const likes = await db.orm.public.Like.where(l => or(l.fromUserId.eq(userId), l.toUserId.eq(userId))).all();
    const passes = await db.orm.public.Pass.where(p => or(p.userId.eq(userId), p.targetUserId.eq(userId))).all();
    const heartBucket = await db.orm.public.HeartBucket.where(h => or(h.userId.eq(userId), h.targetUserId.eq(userId))).all();

    const wingles = await db.orm.public.Wingle.where(w => or(w.fromUserId.eq(userId), w.toUserId.eq(userId))).all();
    const connections = await db.orm.public.Connection.where(c => or(c.userId1.eq(userId), c.userId2.eq(userId))).all();
    const blocks = await db.orm.public.Block.where(b => or(b.blockerId.eq(userId), b.blockedUserId.eq(userId))).all();
    const notifications = await db.orm.public.Notification.where({ userId }).all();

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
      const rUsers = await db.orm.public.User.where((u) => u.id.in(uIds)).all();
      const rPhotos = await db.orm.public.Photo.where((p) => p.userId.in(uIds)).all();
      relatedUsers = rUsers.map((u: any) => ({
        ...u,
        photos: rPhotos.filter((p: any) => p.userId === u.id && p.moderation === 'approved')
      }));
    }

    const mappedRelatedUsers = relatedUsers.map((user: any) => ({
      ...user,
      lastActiveAt: user.lastActiveAt?.toString() || new Date().toISOString(),
      createdAt: user.createdAt?.toString() || new Date().toISOString(),
      lastDailyBonusAt: user.lastDailyBonusAt?.toString() || null,
      interests: typeof user.interests === 'string' ? JSON.parse(user.interests) : user.interests,
      traits: typeof user.traits === 'string' ? JSON.parse(user.traits) : user.traits,
      lifestyle: typeof user.lifestyle === 'string' ? JSON.parse(user.lifestyle) : user.lifestyle,
      photos: user.photos?.map((p: any) => ({
        ...p,
        uploadedAt: p.uploadedAt?.toString() || new Date().toISOString()
      })) || []
    }));

    const payload = {
      likes: likes.map(l => ({ ...l, createdAt: l.createdAt.toString() })),
      passes,
      heartBucket,
      wingles: wingles.map(w => ({ ...w, createdAt: w.createdAt.toString(), respondedAt: w.respondedAt?.toString() })),
      connections: connections.map(c => ({
        id: c.id,
        userIds: [c.userId1, c.userId2],
        createdAt: c.createdAt.toString()
      })),
      blocks: blocks.map(b => ({ ...b, createdAt: b.createdAt.toString() })),
      relatedUsers: mappedRelatedUsers,
      notifications: notifications.map(n => ({ ...n, createdAt: n.createdAt.toString() }))
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

    return { ok: true, data: { ...photo, uploadedAt: photo.uploadedAt.toString() } };
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


