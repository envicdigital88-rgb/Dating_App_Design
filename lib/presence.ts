export const PRESENCE_INTERVAL_MS = 20_000;
export const PRESENCE_ONLINE_MS = 60_000;
export const PRESENCE_BATCH_SIZE = 100;

export function recordedLastSeen(user: { lastActiveAt: { toString(): string }; createdAt: { toString(): string } }) {
  const lastSeen = user.lastActiveAt.toString();
  // Existing accounts have the signup timestamp in both fields.
  return Date.parse(lastSeen) > Date.parse(user.createdAt.toString()) ? lastSeen : null;
}

export function isOnlineAt(lastSeen: string | null | undefined, now = Date.now()) {
  if (!lastSeen) return false;
  const age = now - Date.parse(lastSeen);
  return age >= 0 && age < PRESENCE_ONLINE_MS;
}

const lastSeenDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Colombo',
});

export function presenceLabel(lastSeen: string | null | undefined, showOnline = true) {
  if (showOnline && isOnlineAt(lastSeen)) return 'Online now';
  return lastSeen && Number.isFinite(Date.parse(lastSeen))
    ? `Last seen ${lastSeenDate.format(new Date(lastSeen))} (SL time)`
    : 'Last seen unavailable';
}
