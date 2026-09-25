import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").toLowerCase(),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(8, "Password must be at least 8 characters"),
  age: z.coerce.number().min(18, "Must be at least 18 years old").max(120),
  gender: z.enum(["woman", "man", "non-binary"]),
  intention: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const validated = registerSchema.safeParse(rawData);

    if (!validated.success) {
      return NextResponse.json({ ok: false, error: "Validation failed", details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, phone, password, age, gender, intention } = validated.data;

    const existingUser = await db.orm.public.User.where({ email }).first();
    if (existingUser) {
      return NextResponse.json({ ok: false, error: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.orm.public.User.create({
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      age,
      gender,
      intention,
      interests: '[]',
      traits: '[]',
      lifestyle: JSON.stringify({
        drinking: '',
        smoking: '',
        exercise: '',
        pets: '',
        children: '',
        education: '',
        work: ''
      }),
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true, data: { userId: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Registration API error:", error);
    return NextResponse.json({ ok: false, error: "An unexpected error occurred during registration" }, { status: 500 });
  }
}
