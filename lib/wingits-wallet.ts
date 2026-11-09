import type { db } from '@/lib/db';

export type WalletTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export const MAX_WINGITS = 2_147_483_647;

// Lock the account before reading a balance that this transaction will replace.
export async function lockWingitsWallet(tx: WalletTransaction, userId: string) {
  const plan = tx.sql.public.user
    .update(fields => ({ wingitsBalance: fields.wingitsBalance }))
    .where((fields, fns) => fns.eq(fields.id, userId))
    .build();
  return (await tx.execute(plan)).affectedRows === 1;
}
