export const CHAT_IMAGE_SEND_COST = 2;
export const CHAT_IMAGE_VIEW_COST = 4;

type ImageAccount = { isUnlimited?: boolean } | null | undefined;

export function chatImageSendCost(account: ImageAccount) {
  return account?.isUnlimited ? 0 : CHAT_IMAGE_SEND_COST;
}

export function chatImageViewCost(image: { viewOnce: boolean; imageViewCount: number }, account?: ImageAccount) {
  if (account?.isUnlimited) return 0;
  return image.viewOnce || image.imageViewCount > 0 ? CHAT_IMAGE_VIEW_COST : 0;
}

export type ChatImageViewResult =
  | { ok: true; data: { imageUrl: string; imageViewCount: number; charged: number; remainingBalance: number } }
  | { ok: false; error: string; reason?: 'insufficient_wingits' | 'price_changed' };
