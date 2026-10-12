import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ ok: true, user });
  } catch (error: any) {
    console.error('API /api/auth/me error:', error);
    return NextResponse.json({ ok: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
