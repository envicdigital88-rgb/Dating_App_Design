import 'dotenv/config';
import { db } from '../lib/db';

async function main() {
  const wingles = await db.orm.public.Wingle.all();
  console.log('All wingles:', wingles);
  
  const conns = await db.orm.public.Connection.all();
  console.log('All connections:', conns);
  
  const convs = await db.orm.public.Conversation.all();
  console.log('All conversations:', convs);
  
  process.exit(0);
}

main().catch(console.error);
