import { NextRequest, NextResponse } from 'next/server';
import { getDiscoverUsers } from '@/app/actions/user';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const filters = body?.filters;
    const seenIds = Array.isArray(body?.seenIds) ? body.seenIds : [];

    const res = await getDiscoverUsers(filters, seenIds);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('API /api/discover POST error:', error);
    return NextResponse.json({ ok: false, error: error?.message || 'Server error', data: [] }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ageMin = url.searchParams.get('ageMin') ? Number(url.searchParams.get('ageMin')) : undefined;
    const ageMax = url.searchParams.get('ageMax') ? Number(url.searchParams.get('ageMax')) : undefined;
    const gender = url.searchParams.get('gender') || undefined;
    const intention = url.searchParams.get('intention') || undefined;
    const onlineOnly = url.searchParams.get('onlineOnly') === 'true';

    const filters = (ageMin || ageMax || gender || intention || onlineOnly) ? {
      ageMin: ageMin || 18,
      ageMax: ageMax || 60,
      gender: (gender as any) || 'any',
      intention: intention || 'any',
      onlineOnly
    } : undefined;

    const res = await getDiscoverUsers(filters, []);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('API /api/discover GET error:', error);
    return NextResponse.json({ ok: false, error: error?.message || 'Server error', data: [] }, { status: 500 });
  }
}
