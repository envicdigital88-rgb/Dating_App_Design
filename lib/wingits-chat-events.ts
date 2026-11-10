export interface WingitsChatEvent {
  id: string;
  kind: 'wingits_request' | 'wingits_received';
  senderId: string;
  amount: number;
  createdAt: string;
}

export const WINGITS_CHAT_CHANGED = 'wingits-chat-changed';

export function announceWingitsChatChange(conversationId: string) {
  window.dispatchEvent(new CustomEvent(WINGITS_CHAT_CHANGED, { detail: conversationId }));
}
