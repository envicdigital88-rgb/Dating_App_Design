'use server'

import { db } from '@/lib/db'
import { createSession, deleteSession } from '@/lib/session'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").toLowerCase(),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(8, "Password must be at least 8 characters"),
  age: z.coerce.number().min(18, "Must be at least 18 years old").max(120),
  gender: z.enum(["woman", "man", "non-binary"]),
  intention: z.string(),
})

export async function registerUser(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = registerSchema.safeParse(rawData)

    if (!validated.success) {
      return { 
        ok: false, 
        error: "Validation failed", 
        details: validated.error.flatten().fieldErrors 
      }
    }

    const { name, email, phone, password, age, gender, intention } = validated.data

    // Check if user already exists
    const existingUser = await db.orm.public.User.where({ email }).first()
    if (existingUser) {
      return { ok: false, error: "Email already in use" }
    }

    // Hash password with high security (salt rounds 12)
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.orm.public.User.create({
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      age,
      gender,
      intention,
      interests: '[]', // Default empty JSON arrays
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
    })

    await createSession(user.id)
    return { ok: true, data: { userId: user.id, name: user.name, role: user.role } }
  } catch (error) {
    console.error("Registration error:", error)
    return { ok: false, error: "An unexpected error occurred during registration" }
  }
}

const loginSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
})

export async function loginUser(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const validated = loginSchema.safeParse(rawData)

    if (!validated.success) {
      return { ok: false, error: "Invalid input" }
    }

    const { email, password } = validated.data

    const user = await db.orm.public.User.where({ email }).first()
    
    // Constant time comparison to prevent timing attacks, even if user doesn't exist
    if (!user) {
      await bcrypt.hash(password, 12) // fake hash to balance response time
      return { ok: false, error: "Invalid email or password" }
    }

    const isMatch = await bcrypt.compare(password, user.password)
    
    if (!isMatch) {
      return { ok: false, error: "Invalid email or password" }
    }

    // Update last active
    await db.orm.public.User.where({ id: user.id }).update({ 
      online: true 
    })

    await createSession(user.id)
    return { ok: true, data: { userId: user.id, name: user.name, role: user.role } }
  } catch (error) {
    console.error("Login error:", error)
    return { ok: false, error: "An unexpected error occurred during login" }
  }
}

export async function logoutUser() {
  await deleteSession()
  return { ok: true }
}
