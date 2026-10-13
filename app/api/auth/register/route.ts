import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(8, "Invalid phone number"),
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

    const { name, phone, password, age, gender, intention } = validated.data;

    const existingUser = await db.orm.public.User.where({ phone }).first();
    if (existingUser) {
      return NextResponse.json({ ok: false, error: "Phone number already in use" }, { status: 400 });
    }

    const { formatNotifyPhoneNumber, getPhoneVariants } = await import('@/lib/notify');
    const formattedPhone = formatNotifyPhoneNumber(phone);
    const phoneVariants = getPhoneVariants(phone);

    // Check if any Secret Wingles were sent to this phone before registration
    const pendingSecretWingles = await db.orm.public.SecretWingle.where(sw =>
      sw.targetPhone.in(phoneVariants)
    ).all();

    const secretBonus = pendingSecretWingles.length * 20;
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.transaction(async (tx) => {
      const newUser = await tx.orm.public.User.create({
        name,
        email: `${phone}@temp.winglemingle.com`,
        phone: formattedPhone || phone,
        password: hashedPassword,
        age,
        gender,
        intention,
        wingitsBalance: secretBonus,
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

      if (secretBonus > 0) {
        await tx.orm.public.WingitsTransaction.create({
          id: crypto.randomUUID(),
          userId: newUser.id,
          amount: secretBonus,
          type: 'bonus',
          description: `Secret Wingle welcome gift (+${secretBonus} Wingits)`
        });
      }

      return newUser;
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true, data: { userId: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Registration API error:", error);
    return NextResponse.json({ ok: false, error: "An unexpected error occurred during registration" }, { status: 500 });
  }
}
