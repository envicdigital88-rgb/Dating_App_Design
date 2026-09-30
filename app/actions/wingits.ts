'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function getWingitsBalanceAction(): Promise<number> {
  const session = await getSession();
  if (!session?.userId) return 0;

  const user = await db.orm.public.User.select('wingitsBalance').first({ id: session.userId as string });
  return user?.wingitsBalance || 0;
}

export async function spendWingitsAction(amount: number, description: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: 'Unauthorized' };

  if (amount <= 0) return { ok: false, error: 'Invalid amount' };

  try {
    const result = await db.transaction(async (tx) => {
      const user = await tx.orm.public.User.select('wingitsBalance').first({ id: session.userId as string });

      if (!user || user.wingitsBalance < amount) {
        throw new Error('Insufficient Wingits');
      }

      await tx.orm.public.User
        .where({ id: session.userId as string })
        .update({ wingitsBalance: user.wingitsBalance - amount });

      await tx.orm.public.WingitsTransaction.create({
        id: crypto.randomUUID(),
        userId: session.userId as string,
        amount: -amount,
        type: 'spend',
        description,
        createdAt: new Date().toISOString()
      });

      return { ok: true };
    });

    return result;
  } catch (error: any) {
    return { ok: false, error: error.message || 'Transaction failed' };
  }
}

export async function addWingitsAction(amount: number, description: string, paymentRef: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: 'Unauthorized' };

  if (amount <= 0) return { ok: false, error: 'Invalid amount' };

  try {
    const result = await db.transaction(async (tx) => {
      const user = await tx.orm.public.User.select('wingitsBalance').first({ id: session.userId as string });
      const currentBalance = user?.wingitsBalance || 0;

      await tx.orm.public.User
        .where({ id: session.userId as string })
        .update({ wingitsBalance: currentBalance + amount });

      await tx.orm.public.WingitsTransaction.create({
        id: crypto.randomUUID(),
        userId: session.userId as string,
        amount: amount,
        type: 'purchase',
        description: `${description} (Ref: ${paymentRef})`,
        createdAt: new Date().toISOString()
      });

      return { ok: true };
    });

    return result;
  } catch (error: any) {
    return { ok: false, error: error.message || 'Transaction failed' };
  }
}
