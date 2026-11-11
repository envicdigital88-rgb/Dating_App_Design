export const CHAT_IMAGE_SEND_COST = 2;
export const CHAT_IMAGE_VIEW_COST = 4;

export function chatImageViewCost(image: { viewOnce: boolean; imageViewCount: number }) {
  return image.viewOnce || image.imageViewCount > 0 ? CHAT_IMAGE_VIEW_COST : 0;
}

export type ChatImageViewResult =
  | { ok: true; data: { imageUrl: string; imageViewCount: number; charged: number; remainingBalance: number } }
  | { ok: false; error: string; reason?: 'insufficient_wingits' | 'price_changed' };
