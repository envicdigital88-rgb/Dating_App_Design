import 'dotenv/config';
import { db } from '../lib/db';

async function main() {
  console.log('--- Checking for users needing selfie verification notification ---');
  const allUsers = await db.orm.public.User.where({ role: 'member' }).all();
  console.log(`Total member users found: ${allUsers.length}`);

  let createdCount = 0;

  for (const user of allUsers) {
    if (user.isUnlimited) continue;
    
    // Check if user has not completed approved selfie verification
    const isVerified = Boolean(user.verificationSelfie) && user.selfieStatus === 'approved';
    if (isVerified) continue;

    // Check if notification already exists
    const existingNotif = await db.orm.public.Notification.where({
      userId: user.id
    }).all();

    const hasSelfieNotif = existingNotif.some(n => n.type === 'selfie_verification' || n.href === '/verify-selfie');
    if (!hasSelfieNotif) {
      await db.orm.public.Notification.create({
        userId: user.id,
        type: 'selfie_verification',
        title: 'Selfie Verification Required 📸',
        body: 'Complete your quick live selfie to activate your account, show up on Discover, and send Wingles!',
        href: '/verify-selfie'
      });
      createdCount++;
      console.log(`Created notification for user ${user.name} (${user.id})`);
    }
  }

  console.log(`--- Finished. Created ${createdCount} selfie verification notifications ---`);
  process.exit(0);
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
