import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await req.formData();
    const socketId = data.get('socket_id') as string;
    const channel = data.get('channel_name') as string;

    // Ensure users can only subscribe to their own private channel
    if (channel !== `private-user-${session.userId}`) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channel);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
