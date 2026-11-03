import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await deleteSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      maxAge: 0,
      sameSite: 'lax',
      path: '/',
    });
    return res;
  } catch (error: any) {
    console.error('Logout API error:', error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return POST();
}
