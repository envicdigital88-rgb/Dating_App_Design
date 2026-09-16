'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function verifyPhoneNumber() {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return { ok: false, error: 'Unauthorized' }
    }

    // In a real app, this is where you'd call an SMS provider like Twilio
    // to send an OTP to `phone`.
    // For this demo, we'll just simulate a successful send.
    
    return { ok: true }
  } catch (error) {
    console.error('Verify phone error:', error)
    return { ok: false, error: 'Failed to send OTP' }
  }
}

export async function confirmOtp(phone: string, otp: string) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return { ok: false, error: 'Unauthorized' }
    }

    // In a real app, you would verify the OTP here with your SMS provider.
    // For this demo, we'll accept '000000' or any 4-6 digit code.
    if (otp.length < 4) {
      return { ok: false, error: 'Invalid OTP' }
    }

    // Update the user's phone number and set verified to true
    await db.orm.public.User.where({ id: session.userId as string }).update({
      phone: phone,
      verified: true
    })

    return { ok: true }
  } catch (error) {
    console.error('Confirm OTP error:', error)
    return { ok: false, error: 'Failed to verify OTP' }
  }
}
