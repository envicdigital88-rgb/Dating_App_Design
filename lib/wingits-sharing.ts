export const WINGITS_SHARING_BALANCE_THRESHOLD = 15;
// Older transfers may contain free credits. Only transfers checked under this rule are eligible again.
export const PAID_WINGITS_RECEIVED_TYPE = 'transfer_received_paid';

export function transferableWingits(balance: number, transactions: { type: string; amount: number }[]) {
  let purchased = 0;
  let free = 0;
  for (const transaction of transactions) {
    const { amount, type } = transaction;
    if (amount > 0) {
      if (type === 'purchase' || type === PAID_WINGITS_RECEIVED_TYPE) purchased += amount;
      else free += amount;
    } else if (amount < 0) {
      let debit = -amount;
      if (type !== 'transfer_sent') {
        // Personal use consumes free credits first. Transfers can only consume purchased credits.
        const freeUsed = Math.min(free, debit);
        free -= freeUsed;
        debit -= freeUsed;
      }
      purchased = Math.max(0, purchased - debit);
    }
  }
  // Unrecorded credits never create transferable funds; unrecorded debits reduce them.
  const unrecordedDebit = Math.max(0, purchased + free - balance);
  return Math.max(0, Math.min(balance, purchased - unrecordedDebit));
}

export type WingitsSharingStatus = {
  balance: number;
  transferable: number;
};
