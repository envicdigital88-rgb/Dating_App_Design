import { db } from '@/lib/db';

export async function accountSessionVersion(userId: string) {
  const user = await db.orm.public.User.select('sessionVersion').first({ id: userId });
  return user?.sessionVersion ?? null;
}

export async function isCurrentSession(payload: Record<string, unknown>) {
  if (typeof payload.userId !== 'string') return false;
  const version = payload.sessionVersion ?? 0; // Existing sessions start at version zero.
  if (typeof version !== 'number' || !Number.isInteger(version)) return false;
  return await accountSessionVersion(payload.userId) === version;
}
