import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const validated = loginSchema.safeParse(rawData);

    if (!validated.success) {
      return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
    }

    const { email, password } = validated.data;

    const user = await db.orm.public.User.where({ email }).first();
    
    if (!user) {
      await bcrypt.hash(password, 12); // fake hash to balance response time
      return NextResponse.json({ ok: false, error: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return NextResponse.json({ ok: false, error: "Invalid email or password" }, { status: 401 });
    }

    if (user.suspended) {
      return NextResponse.json({ ok: false, error: "Your account has been suspended due to community reports." }, { status: 403 });
    }

    await db.orm.public.User.where({ id: user.id }).update({ online: true });
    await createSession(user.id);

    return NextResponse.json({ ok: true, data: { userId: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ ok: false, error: "An unexpected error occurred during login" }, { status: 500 });
  }
}
