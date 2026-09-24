import { db } from './lib/db';
import { seedUsers, seedPhotos, seedLikes, seedWingles, seedConnections, seedConversations, seedMingles } from './lib/data/seed';

async function main() {
  console.log('Clearing old data...');
  try {
    await db.orm.public.Photo.where({}).delete().catch(() => {});
    await db.orm.public.User.where({}).delete().catch(() => {});
    
    console.log('Inserting seed users...');
    for (const user of seedUsers) {
      await db.orm.public.User.create({
        id: user.id,
        phone: user.phone || '',
        name: user.name || '',
        gender: user.gender,
        email: user.email || '',
        intention: user.intention,
        age: user.age,
        location: user.location,
        bio: user.bio,
        lifestyle: JSON.stringify(user.lifestyle || {}),
        interests: JSON.stringify(user.interests || []),
        traits: JSON.stringify(user.traits || []),
        role: user.role,
        status: user.status,
        onboarded: user.onboarded,
        suspended: user.suspended,
        isAnonymous: user.isAnonymous,
        anonymousName: user.anonymousName,
        createdAt: new Date(user.createdAt || Date.now()),
        lastActiveAt: new Date(user.lastActiveAt || Date.now()),
      });
    }

    console.log('Inserting seed photos...');
    for (const photo of seedPhotos) {
      await db.orm.public.Photo.create({
        id: photo.id,
        userId: photo.userId,
        url: photo.url,
        isPrimary: photo.isPrimary,
        order: photo.order,
        moderation: photo.moderation,
        uploadedAt: new Date(photo.uploadedAt || Date.now())
      });
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding DB:', error);
  }
}

main();
