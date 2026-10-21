'use server';

import { buyWingitsAction as buyWingits, verifyPaymentAction as verifyPayment, type PaymentInitResult } from '@/app/actions/payments';

export async function buyWingitsAction(packageAmountLKR: number, wingitsAmount: number): Promise<PaymentInitResult> {
  return buyWingits(packageAmountLKR, wingitsAmount);
}

export async function verifyPaymentAction(ledgerId: string, transactionId: string) {
  return verifyPayment(ledgerId, transactionId);
}

export async function createIpgTransaction(_packageId: string, amount: number): Promise<PaymentInitResult> {
  return buyWingits(amount, amount);
}