import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { userId } = await params;
    if (!userId) {
      return new NextResponse(null, { status: 400 });
    }

    // Only admin or the user themselves can view their verification selfie
    const caller = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (!caller || (caller.role !== 'admin' && caller.id !== userId)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const user = await db.orm.public.User.where({ id: userId }).first();
    if (!user || !user.verificationSelfie) {
      return new NextResponse(null, { status: 404 });
    }

    if (user.verificationSelfie.startsWith('data:')) {
      const matches = user.verificationSelfie.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'private, max-age=86400'
          }
        });
      }
    }

    return NextResponse.redirect(new URL(user.verificationSelfie, request.url));
  } catch (err) {
    console.error('API /api/selfie/[userId] error:', err);
    return new NextResponse(null, { status: 500 });
  }
}

