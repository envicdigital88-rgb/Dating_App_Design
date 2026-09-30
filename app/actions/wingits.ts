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
        description
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
        description: `${description} (Ref: ${paymentRef})`
      });

      return { ok: true };
    });

    return result;
  } catch (error: any) {
    return { ok: false, error: error.message || 'Transaction failed' };
  }
}

export async function checkWelcomeBonusAction(): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session?.userId) return true; // prevent popup if not logged in

    const transaction = await db.orm.public.WingitsTransaction
      .where({ userId: session.userId as string, description: 'Welcome Bonus' })
      .first();

    return !!transaction;
  } catch (error) {
    console.error('checkWelcomeBonusAction error:', error);
    return true; // hide popup on error
  }
}

export async function claimWelcomeBonusAction(): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.userId) return { ok: false, error: 'Unauthorized' };

    await db.transaction(async (tx) => {
      const existing = await tx.orm.public.WingitsTransaction
        .where({ userId: session.userId as string, description: 'Welcome Bonus' })
        .first();

      if (existing) {
        throw new Error('Welcome bonus already claimed');
      }

      const user = await tx.orm.public.User.select('wingitsBalance').first({ id: session.userId as string });
      const currentBalance = user?.wingitsBalance || 0;

      await tx.orm.public.User
        .where({ id: session.userId as string })
        .update({ wingitsBalance: currentBalance + 20 });

      await tx.orm.public.WingitsTransaction.create({
        id: crypto.randomUUID(),
        userId: session.userId as string,
        amount: 20,
        type: 'bonus',
        description: 'Welcome Bonus'
      });
    });

    return { ok: true };
  } catch (error: any) {
    console.error('claimWelcomeBonusAction error:', error);
    return { ok: false, error: error?.message || 'Failed to claim bonus' };
  }
}
