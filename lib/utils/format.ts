import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns';

export const relativeTime = (iso: string) => `${formatDistanceToNowStrict(new Date(iso))} ago`;

export const shortDate = (iso: string) => format(new Date(iso), 'd MMM yyyy');

export const mingleTime = (iso: string) => format(new Date(iso), 'HH:mm');

export const dayLabel = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE d MMM');
};

export const money = (amount: number) =>
amount === 0 ?
'Free' :
new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

export const presence = (online: boolean, lastActiveAt: string) =>
online ? 'Online now' : `Active ${formatDistanceToNowStrict(new Date(lastActiveAt))} ago`;

export const cn = (...parts: Array<string | false | null | undefined>) =>
parts.filter(Boolean).join(' ');

export const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;