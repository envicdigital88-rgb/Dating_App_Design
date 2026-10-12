'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function verifyEmailAddress(email: string) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return { ok: false, error: 'Unauthorized' }
    }

    // Check if email is already taken before sending OTP
    const existing = await db.orm.public.User.where({ email }).first();
    if (existing && existing.id !== session.userId) {
      return { ok: false, error: 'This email is already in use by another account.' }
    }

    // In a real app, generate a real OTP and save it in the database.
    // For this demo, we'll simulate sending the OTP.
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await resend.emails.send({
      from: 'Wingle Mingle <no-reply@winglemingle.com>',
      to: email,
      subject: 'Verify your email address',
      html: `<p>Your verification code is: <strong>${otp}</strong></p>`
    });

    return { ok: true }
  } catch (error: any) {
    console.error('Verify email error:', error)
    return { ok: false, error: error?.message || 'Failed to send OTP email' }
  }
}

export async function confirmEmailOtp(email: string, otp: string) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return { ok: false, error: 'Unauthorized' }
    }

    if (otp.length < 4) {
      return { ok: false, error: 'Invalid OTP' }
    }

    // Check if email is already taken
    const existing = await db.orm.public.User.where({ email }).first();
    if (existing && existing.id !== session.userId) {
      return { ok: false, error: 'This email is already in use by another account.' }
    }

    // Update the user's email and set verified to true
    await db.orm.public.User.where({ id: session.userId as string }).update({
      email: email,
      verified: true
    })

    return { ok: true }
  } catch (error: any) {
    console.error('Confirm OTP error:', error)
    return { ok: false, error: error?.message || 'Failed to verify OTP' }
  }
}
