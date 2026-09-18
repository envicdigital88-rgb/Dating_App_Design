import { db } from './lib/db';

async function test() {
  try {
    const m = await db.orm.public.Mingle.first();
    console.log('Mingle ok:', m?.id);
  } catch(e) {
    console.error(e);
  }
}

test();
