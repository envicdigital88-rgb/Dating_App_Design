'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { lockWingitsWallet, MAX_WINGITS, type WalletTransaction } from '@/lib/wingits-wallet';

export async function getWingitsBalanceAction(): Promise<number> {
  const session = await getSession();
  if (!session?.userId) return 0;

  const user = await db.orm.public.User.select('wingitsBalance').first({ id: session.userId as string });
  return user?.wingitsBalance || 0;
}

export async function spendWingitsAction(amount: number, description: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: 'Unauthorized' };

  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_WINGITS) return { ok: false, error: 'Invalid amount' };

  try {
    const result = await db.transaction(async (tx) => {
      await lockWingitsWallet(tx, session.userId as string);
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

async function welcomeBonusDue(tx: WalletTransaction, userId: string, balance: number) {
  const transfers = await tx.orm.public.WingitsTransaction.select('amount').where({ userId })
    .where(t => t.type.in(['transfer_sent', 'transfer_received'])).all();
  const netTransfers = transfers.reduce((total, transfer) => total + transfer.amount, 0);
  // Legacy wallets may already hold the welcome credits. Gifts do not count toward that amount.
  return Math.max(0, Math.min(20, 20 - (balance - netTransfers), MAX_WINGITS - balance));
}

export async function checkWelcomeBonusAction(): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session?.userId) return true; // prevent popup if not logged in

    const userId = session.userId as string;
    const claim = { userId, type: 'bonus', description: 'Welcome Bonus' };
    if (await db.orm.public.WingitsTransaction.first(claim)) return true;
    return await db.transaction(async tx => {
      if (!await lockWingitsWallet(tx, userId)) return true;
      if (await tx.orm.public.WingitsTransaction.first(claim)) return true;
      const user = await tx.orm.public.User.select('wingitsBalance').first({ id: userId });
      if (!user || await welcomeBonusDue(tx, userId, user.wingitsBalance) > 0) return false;
      await tx.orm.public.WingitsTransaction.create({
        ...claim, amount: 0,
      });
      return true;
    });
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
      const userId = session.userId as string;
      if (!await lockWingitsWallet(tx, userId)) throw new Error('Account not found');
      const existing = await tx.orm.public.WingitsTransaction
        .where({ userId, type: 'bonus', description: 'Welcome Bonus' })
        .first();

      if (existing) {
        throw new Error('Welcome bonus already claimed');
      }

      const user = await tx.orm.public.User.select('wingitsBalance').first({ id: userId });
      if (!user) throw new Error('Account not found');
      const amount = await welcomeBonusDue(tx, userId, user.wingitsBalance);
      if (amount) await tx.orm.public.User.where({ id: userId }).update({ wingitsBalance: user.wingitsBalance + amount });

      await tx.orm.public.WingitsTransaction.create({
        userId,
        amount,
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

export async function getWingitsTransactionsAction(): Promise<any[]> {
  const session = await getSession();
  if (!session?.userId) return [];

  const txs = await db.orm.public.WingitsTransaction
    .where({ userId: session.userId as string })
    .where(t => t.amount.neq(0))
    .orderBy(t => t.createdAt.desc())
    .limit(50)
    .all();

  return txs.map((tx: any) => ({
    ...tx,
    createdAt: tx.createdAt?.toString() || new Date().toISOString()
  }));
}
