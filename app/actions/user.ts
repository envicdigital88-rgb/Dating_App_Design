'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

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

    await db.orm.public.User.where({ id: session.userId as string }).update(data)
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

export async function getDiscoverUsers() {
  try {
    const session = await getSession()
    if (!session?.userId) return { ok: false, error: 'Unauthorized', data: [] }
    
    const users = await db.orm.public.User.where({
      onboarded: true,
      role: 'member',
      suspended: false
    })
      .include('prompts')
      .include('photos')
      .all()
    
    // Process JSON fields and dates
    const mappedUsers = users.map((user: any) => ({
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
    }))
    
    return { ok: true, data: mappedUsers }
  } catch (err) {
    console.error('getDiscoverUsers error:', err)
    return { ok: false, error: 'Failed to fetch discover users', data: [] }
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
        id: `pr_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        question: p.question,
        answer: p.answer
      }));
      // Prisma 8 array insert
      if (promptsToInsert.length > 0) {
        await Promise.all(promptsToInsert.map((prompt: any) => db.orm.public.Prompt.create(prompt)));
      }
    }

    // Handle photos
    if (photoUrls && photoUrls.length > 0) {
      await db.orm.public.Photo.where({ userId }).delete();
      const photosToInsert = photoUrls.map((url: string, index: number) => ({
        id: `ph_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        url,
        order: index,
        isPrimary: index === 0,
        moderation: 'approved',
        // Omitting uploadedAt as the DB handles it with a default expression
      }));
      // Use ORM to create multiple photos
      await Promise.all(photosToInsert.map((photo: any) => db.orm.public.Photo.create(photo)));
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

    // Fetch users except current user
    // Also, we should exclude users who have already been liked/passed/blocked.
    // For now, let's just get a basic list of users that are not the current user.
    const users = await db.orm.public.User.where(
      (u) => u.id.neq(session.userId as string)
    ).all()
    
    // In a real app we'd map this, fetch photos, and calculate vibe match score here.
    return { ok: true, data: users }
  } catch (err) {
    console.error('Discover profiles error:', err)
    return { ok: false, error: 'Failed to fetch profiles' }
  }
}
