import { db } from './lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  const adminEmail = 'admin@winglemingle.app';
  const adminPassword = 'admin123';
  
  const existingAdmin = await db.orm.public.User.where({ email: adminEmail }).first();
  if (existingAdmin) {
    console.log("Admin already exists!");
    return;
  }
  
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  await db.orm.public.User.create({
    name: 'Rowan (Admin)',
    email: adminEmail,
    phone: '+44 7700 900000',
    password: hashedPassword,
    role: 'admin',
    age: 38,
    gender: 'non-binary',
    intention: 'Long-term relationship',
    interests: '[]',
    traits: '[]',
    lifestyle: JSON.stringify({
      drinking: 'Socially',
      smoking: 'Never',
      exercise: 'Often',
      pets: 'Dog',
      children: 'None',
      education: 'Undergraduate',
      work: 'Trust & Safety Lead'
    }),
    verified: true,
    suspended: false,
    onboarded: true,
    online: true
  });
  
  console.log("Admin created successfully!");
}

main().catch(console.error);
