import { db } from '@/lib/db'

async function test() {
  try {
    const users1 = await db.orm.public.User.where({ onboarded: true }).take(10).all();
    console.log("take worked", users1.length);
  } catch (e) {
    console.log("take failed", e.message);
  }

  try {
    const users2 = await db.orm.public.User.where({ onboarded: true }).limit(10).all();
    console.log("limit worked", users2.length);
  } catch (e) {
    console.log("limit failed", e.message);
  }
}
test();
