'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { not, or } from '@prisma/orm-postgres/orm-client'

export async function getCurrentUser() {
  try {
    const session = await getSession()
    console.log('getCurrentUser session:', session)
    if (!session?.userId) return null

    const user = await db.orm.public.User.where({ id: session.userId as string })
      .include('prompts')
      .include('photos')
      .first()
    console.log('getCurrentUser user found:', !!user)
    if (!user) return null

    // Ensure plain object for Next.js Client Components (Prisma 8 Temporal serialization)
    return {
      ...user,
      lastActiveAt: user.lastActiveAt?.toString() || new Date().toISOString(),
      createdAt: user.createdAt?.toString() || new Date().toISOString(),
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
  return user
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

export async function suspendUserAction(targetUserId: string, suspended: boolean) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized' }

    // Verify caller is admin
    const caller = await db.orm.public.User.where({ id: session.userId as string }).first()
    if (!caller || caller.role !== 'admin') {
      return { ok: false, error: 'Forbidden' }
    }

    await db.orm.public.User.where({ id: targetUserId }).update({ suspended })
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

export async function getDiscoverUsers(filters?: DiscoverFilters) {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized', data: [] }
    const userId = session.userId as string
    
    const likes = await db.orm.public.Like.where({ fromUserId: userId }).all();
    const passes = await db.orm.public.Pass.where({ userId }).all();
    const heartBucket = await db.orm.public.HeartBucket.where({ userId }).all();
    const blocks = await db.orm.public.Block.where((b) => or(b.blockerId.eq(userId), b.blockedUserId.eq(userId))).all();
    
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const recentPasses = passes.filter((p: any) => new Date(p.createdAt) >= tenDaysAgo);

    const excludedIds = [
      userId,
      ...likes.map((l: any) => l.toUserId),
      ...recentPasses.map((p: any) => p.targetUserId),
      ...heartBucket.map((h: any) => h.targetUserId),
      ...blocks.map((b: any) => b.blockerId === userId ? b.blockedUserId : b.blockerId)
    ]
    
    // Fetch users only (no includes) - much faster
    const rawUsers = await db.orm.public.User.where({
      onboarded: true,
      role: 'member',
      suspended: false
    }).all()
    
    const excludedSet = new Set(excludedIds);
    let filteredUsers = rawUsers.filter(u => !excludedSet.has(u.id));

    if (filters) {
      filteredUsers = filteredUsers.filter(u => {
        if (u.age < filters.ageMin || u.age > filters.ageMax) return false;
        if (filters.gender !== 'any' && u.gender !== filters.gender) return false;
        if (filters.intention !== 'any' && u.intention !== filters.intention) return false;
        if (filters.onlineOnly) {
          // Assume online if lastActiveAt was within last 10 minutes
          const lastActive = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
          const tenMinsAgo = Date.now() - 10 * 60 * 1000;
          if (lastActive < tenMinsAgo) return false;
        }
        return true;
      });
    }

    const usersWithoutRelations = filteredUsers.slice(0, 20);
    const userIds = usersWithoutRelations.map(u => u.id);

    if (userIds.length === 0) return { ok: true, data: [] };

    // Fetch photos and heartReacts in parallel - NO prompts in initial load
    const [photos, heartReactsRaw] = await Promise.all([
      db.orm.public.Photo.where((p) => p.userId.in(userIds)).all(),
      db.orm.public.HeartBucket.where((h) => h.targetUserId.in(userIds)).all()
    ]);

    const heartReactsMap = new Map();
    if (Array.isArray(heartReactsRaw)) {
      heartReactsRaw.forEach((c: any) => {
        heartReactsMap.set(c.targetUserId, (heartReactsMap.get(c.targetUserId) || 0) + 1);
      });
    }

    const mappedUsers = usersWithoutRelations.map((user: any) => {
      const realCount = heartReactsMap.get(user.id) || 0;
      const fakeCount = ((user.id.charCodeAt(0) + user.id.charCodeAt(user.id.length - 1)) % 50) + 1;

      return {
        ...user,
        lastActiveAt: user.lastActiveAt?.toString() || new Date().toISOString(),
        createdAt: user.createdAt?.toString() || new Date().toISOString(),
        interests: typeof user.interests === 'string' ? JSON.parse(user.interests) : (user.interests || []),
        traits: typeof user.traits === 'string' ? JSON.parse(user.traits) : (user.traits || []),
        lifestyle: typeof user.lifestyle === 'string' ? JSON.parse(user.lifestyle) : (user.lifestyle || {}),
        photos: photos.filter(p => p.userId === user.id).map((p: any) => ({
          ...p,
          uploadedAt: p.uploadedAt?.toString() || new Date().toISOString()
        })),
        prompts: [], // Loaded lazily on profile open
        heartReacts: realCount > 0 ? realCount : fakeCount
      };

    });
    
    return { ok: true, data: mappedUsers }
  } catch (err) {
    console.error('getDiscoverUsers error:', err)
    return { ok: false, error: 'Failed to fetch discover users', data: [] }
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

    const { photoUrls, prompts, ...userData } = data;
    const userId = session.userId as string;

    // Stringify JSON fields because they are stored as text in DB
    const updatePayload = {
      ...userData,
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
    ).all()
    
    // In a real app we'd map this, fetch photos, and calculate vibe match score here.
    return { ok: true, data: users }
  } catch (err) {
    console.error('Discover profiles error:', err)
    return { ok: false, error: 'Failed to fetch profiles' }
  }
}

export async function getUserStateAction() {
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
        db.orm.public.User.where((u) => u.id.in(uIds)).all(),
        db.orm.public.Photo.where((p) => p.userId.in(uIds)).all()
      ]);
      relatedUsers = rUsers.map((u: any) => ({
        ...u,
        photos: rPhotos.filter((p: any) => p.userId === u.id)
      }));
    }

    const mappedRelatedUsers = relatedUsers.map((user: any) => ({
      ...user,
      lastActiveAt: user.lastActiveAt?.toString() || new Date().toISOString(),
      createdAt: user.createdAt?.toString() || new Date().toISOString(),
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
      relatedUsers: mappedRelatedUsers
    };

    console.log(`[getUserStateAction] Returning state for ${userId}: ${wingles.length} wingles, ${connections.length} connections, ${relatedUsers.length} related users`);
    return { 
      ok: true, 
      data: payload
    }
  } catch (err) {
    console.error('getUserStateAction error:', err)
    return { ok: false, error: 'Failed to fetch user state' }
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

