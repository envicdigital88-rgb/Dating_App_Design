import 'dotenv/config';
import { db } from '../lib/db';

async function main() {
  const wingleId = 'dc59b76e-c656-46f4-b58e-f4e2980ae0e1'; // one of the wingles
  
  // Try to update it to declined
  console.log('Updating wingle:', wingleId);
  try {
    await db.orm.public.Wingle.where({ id: wingleId }).update({
      status: 'declined',
      respondedAt: new Date()
    });
    console.log('Update successful!');
    
    // Check it
    const check = await db.orm.public.Wingle.where({ id: wingleId }).first();
    console.log('After update:', check);
  } catch (e) {
    console.error('Update failed:', e);
  }
  
  process.exit(0);
}

main().catch(console.error);
