import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/session';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();
    if (!credential) {
      return NextResponse.json({ ok: false, error: 'Credential is required' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ ok: false, error: 'Google Client ID is not configured.' }, { status: 500 });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return NextResponse.json({ ok: false, error: 'Invalid Google token.' }, { status: 400 });
    }

    const email = payload.email.toLowerCase();

    let user = await db.orm.public.User.where({ email }).first();

    const role = email === 'envicdigital88@gmail.com' ? 'admin' : 'member';

    if (user) {
      if (user.suspended) {
        return NextResponse.json({ ok: false, error: 'Your account has been suspended.' }, { status: 403 });
      }
      
      await db.orm.public.User.where({ id: user.id }).update({ online: true, role });
      
      await createSession(user.id);
      return NextResponse.json({ ok: true, data: { userId: user.id, name: user.name, role: user.role, isNewUser: false } });
    } else {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const { default: bcrypt } = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await db.orm.public.User.create({
        name: payload.name || 'Google User',
        email,
        phone: '',
        password: hashedPassword,
        role,
        age: 20, 
        gender: 'non-binary',
        intention: 'Meeting new people',
        interests: '[]',
        traits: '[]',
        lifestyle: JSON.stringify({}),
        onboarded: false,
      });

      await createSession(user.id);
      return NextResponse.json({ ok: true, data: { userId: user.id, name: user.name, role: user.role, isNewUser: true } });
    }
  } catch (error) {
    console.error("Google Auth API error:", error);
    return NextResponse.json({ ok: false, error: "An unexpected error occurred during Google authentication." }, { status: 500 });
  }
}
