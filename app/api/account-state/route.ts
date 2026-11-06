import { NextResponse } from 'next/server';
import { getConversationsAction } from '@/app/actions/chat';
import { getUserStateAction } from '@/app/actions/user';
import { getSession } from '@/lib/session';

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' };
  const session = await getSession();
  if (typeof session?.userId !== 'string') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }
  const [chatRes, stateRes] = await Promise.all([getConversationsAction(), getUserStateAction()]);
  return NextResponse.json({ userId: session.userId, chatRes, stateRes }, { headers });
}
