export type ActivitySection = 'likes' | 'heartBucket' | 'passes' | 'wingles' | 'notifications';

type ActivityItem = {
  id?: string;
  userId?: string;
  fromUserId?: string;
  toUserId?: string;
  targetUserId?: string;
  status?: string;
  read?: boolean;
  viewed?: boolean;
};

export function activityItemId(section: ActivitySection, item: ActivityItem, userId: string) {
  switch (section) {
    case 'likes': return item.toUserId === userId ? item.fromUserId : undefined;
    case 'heartBucket':
    case 'passes': return item.userId === userId ? item.targetUserId : undefined;
    case 'wingles': return item.toUserId === userId && item.status === 'pending' ? item.id : undefined;
    case 'notifications': return item.userId === userId ? item.id : undefined;
  }
}

// A response started before an acknowledgement must not make a seen item unread again.
export function preserveActivityReadState<T extends ActivityItem>(remote: T, local?: ActivityItem): T {
  if (!local?.read && !local?.viewed) return remote;
  return {
    ...remote,
    ...(local.read ? { read: true } : {}),
    ...(local.viewed ? { viewed: true } : {}),
  };
}
