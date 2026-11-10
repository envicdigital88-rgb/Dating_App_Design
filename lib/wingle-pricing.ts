export const WINGLE_SEND_COST = 5;
export const WINGLE_ACCEPT_COST = 2;
export const SECRET_WINGLE_SEND_COST = 10;
export const SECRET_WINGLE_CASH_LKR = 50;

export const WINGLE_GIFTS = {
  rose: { cost: 5, label: 'Red Rose', icon: '🌹' },
  chocolates: { cost: 8, label: 'Chocolates', icon: '🍫' },
  coffee: { cost: 10, label: 'Coffee', icon: '☕' },
  teddy: { cost: 15, label: 'Cute Teddy', icon: '🧸' }
} as const;

export function getWingleGift(gift?: string) {
  return gift && Object.prototype.hasOwnProperty.call(WINGLE_GIFTS, gift)
    ? WINGLE_GIFTS[gift as keyof typeof WINGLE_GIFTS]
    : undefined;
}
