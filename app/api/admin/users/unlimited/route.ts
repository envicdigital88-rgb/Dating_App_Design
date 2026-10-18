import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const admin = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, isUnlimited } = body;

    if (!userId || typeof isUnlimited !== 'boolean') {
      return NextResponse.json({ ok: false, error: 'Invalid payload: userId and isUnlimited boolean are required.' }, { status: 400 });
    }

    const targetUser = await db.orm.public.User.where({ id: userId }).first();
    if (!targetUser) {
      return NextResponse.json({ ok: false, error: 'Target user not found.' }, { status: 404 });
    }

    // Update in database
    await db.orm.public.User.where({ id: userId }).update({
      isUnlimited: isUnlimited
    });

    return NextResponse.json({
      ok: true,
      data: {
        userId,
        isUnlimited
      }
    });
  } catch (error: any) {
    console.error('API /api/admin/users/unlimited error:', error);
    return NextResponse.json({ ok: false, error: error?.message || 'Server error updating unlimited status' }, { status: 500 });
  }
}
