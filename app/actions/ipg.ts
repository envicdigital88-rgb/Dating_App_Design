'use server';

export { buyWingitsAction, verifyPaymentAction } from '@/app/actions/payments';
import { buyWingitsAction } from '@/app/actions/payments';

export async function createIpgTransaction(_packageId: string, amount: number) {
  return buyWingitsAction(amount, amount);
}