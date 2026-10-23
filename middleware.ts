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

  const sessionCookie = request.cookies.get('session')?.value;
  let payload: any = null;

  if (sessionCookie) {
    try {
      const verified = await jwtVerify(sessionCookie, encodedKey, {
        algorithms: ['HS256'],
      });
      payload = verified.payload;
    } catch (err) {
      // Invalid or expired token
    }
  }

  // If user is unverified and trying to access any route other than verify-phone or verify-email
  if (payload?.userId && payload.verified === false) {
    if (pathname !== '/verify-phone' && pathname !== '/verify-email') {
      const url = request.nextUrl.clone();
      url.pathname = '/verify-phone';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Intercept root landing page and auth pages for already signed-in verified users
  if (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up') {
    if (payload?.userId && payload.verified !== false) {
      const url = request.nextUrl.clone();
      url.pathname = '/discover';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  // Protected routes require valid session
  if (pathname === '/onboarding' || pathname.startsWith('/discover')) {
    if (!payload?.userId) {
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/sign-in', '/sign-up', '/onboarding', '/discover', '/discover/:path*'],
};
