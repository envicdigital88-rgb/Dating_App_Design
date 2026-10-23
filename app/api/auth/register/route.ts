import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { startPendingRegistration } from '@/app/actions/verify';
import { validatePhoneNumber } from '@/lib/notify';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  phone: z.string().refine((val) => validatePhoneNumber(val).valid, {
    message: "Please enter a valid mobile number (e.g. 077 123 4567)"
  }),
  password: z.string().min(8, "Password must be at least 8 characters"),
  age: z.coerce.number().min(18, "Must be at least 18 years old").max(120).optional(),
  gender: z.enum(["woman", "man", "non-binary"]).optional(),
  intention: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const validated = registerSchema.safeParse(rawData);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Validation failed";
      return NextResponse.json({ ok: false, error: firstError, details: fieldErrors }, { status: 400 });
    }

    const { name, email, phone, password, age, gender, intention } = validated.data;

    // Start pending registration (sends 6-digit verification code via SMS to phone, DOES NOT save user in DB until code is confirmed!)
    const result = await startPendingRegistration({
      name,
      email,
      phone,
      password,
      age: age || 20,
      gender: gender || 'woman',
      intention: intention || 'Long-term relationship'
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      requiresVerification: true,
      phone: result.phone,
      maskedPhone: result.maskedPhone,
      email: result.email,
      sentVia: (result as any).sentVia || 'sms',
      message: (result as any).message || 'Verification code sent to your mobile phone via SMS'
    });
  } catch (error: any) {
    console.error("Registration API error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "An unexpected error occurred during registration" }, { status: 500 });
  }
}

