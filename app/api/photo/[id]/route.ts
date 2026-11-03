import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse(null, { status: 400 });
    }

    const photo = await db.orm.public.Photo.where({ id }).first();
    if (!photo || !photo.url) {
      return new NextResponse(null, { status: 404 });
    }

    if (photo.url.startsWith('data:')) {
      const matches = photo.url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000'
          }
        });
      }
    }

    // External URL or relative static path - redirect
    return NextResponse.redirect(new URL(photo.url, request.url));
  } catch (err) {
    console.error('API /api/photo/[id] error:', err);
    return new NextResponse(null, { status: 500 });
  }
}

