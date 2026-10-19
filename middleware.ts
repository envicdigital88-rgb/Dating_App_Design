import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET || 'winglemingle_session_jwt_secret_key_2026_super_secure_auth_token_99x';
const encodedKey = new TextEncoder().encode(secretKey);

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Allow intentional preview mode (?preview=true)
  if (searchParams.get('preview') === 'true') {
    return NextResponse.next();
  }

  // Intercept root landing page and auth pages for already signed-in users
  if (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up') {
    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie) {
      try {
        const { payload } = await jwtVerify(sessionCookie, encodedKey, {
          algorithms: ['HS256'],
        });

        if (payload?.userId) {
          const url = request.nextUrl.clone();
          url.pathname = '/discover';
          url.search = '';
          return NextResponse.redirect(url);
        }
      } catch (err) {
        // Invalid or expired token, proceed normally
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/sign-in', '/sign-up'],
};
