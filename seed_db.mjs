import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

const client = new Client({
  connectionString: process.env.DIRECT_URL
})

const MOCK_USERS = [
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    name: "Amaya",
    age: 26,
    gender: "woman",
    location: "Colombo 07, Sri Lanka",
    bio: "Coffee enthusiast, dog mom, and weekend hiker. Looking for someone to share sunsets and deep conversations.",
    intention: "Long-term relationship",
    interests: '["Coffee", "Dogs", "Hiking", "Photography"]',
    traits: '["Extroverted", "Creative", "Spontaneous"]',
    lifestyle: '["Active", "Social Drinker", "Non-smoker"]',
    phone: "+94770000001",
    email: "amaya@example.com",
    password: "password123",
    verified: true,
    onboarded: true
  },
  {
    id: "3a8b417c-8821-4f35-9614-2391e4a2c5a1",
    name: "Kavindu",
    age: 28,
    gender: "man",
    location: "Mount Lavinia, Sri Lanka",
    bio: "Software engineer by day, musician by night. Always down for trying new food spots.",
    intention: "Dating",
    interests: '["Music", "Foodie", "Tech", "Travel"]',
    traits: '["Introverted", "Analytical", "Loyal"]',
    lifestyle: '["Night owl", "Social Drinker", "Non-smoker"]',
    phone: "+94770000002",
    email: "kavindu@example.com",
    password: "password123",
    verified: true,
    onboarded: true
  },
  {
    id: "9c3d528f-746a-4d2b-b995-1845f3b7d6c2",
    name: "Senali",
    age: 24,
    gender: "woman",
    location: "Kandy, Sri Lanka",
    bio: "Art lover and reader. I prefer quiet evenings with a good book over crowded parties.",
    intention: "Long-term relationship",
    interests: '["Art", "Reading", "Yoga", "Movies"]',
    traits: '["Introverted", "Empathetic", "Organized"]',
    lifestyle: '["Early bird", "Teetotaler", "Non-smoker"]',
    phone: "+94770000003",
    email: "senali@example.com",
    password: "password123",
    verified: true,
    onboarded: true
  }
];

const MOCK_PHOTOS = [
  { userId: "f47ac10b-58cc-4372-a567-0e02b2c3d479", url: "/41c76259-ba28-4b8f-a0f0-db6538f534a4.jpg", order: 1, isPrimary: true },
  { userId: "3a8b417c-8821-4f35-9614-2391e4a2c5a1", url: "/3a8b417c-8821-4f35-9614-2391e4a2c5a1.jpg", order: 1, isPrimary: true },
  { userId: "9c3d528f-746a-4d2b-b995-1845f3b7d6c2", url: "/9c3d528f-746a-4d2b-b995-1845f3b7d6c2.jpg", order: 1, isPrimary: true }
]

async function seed() {
  try {
    await client.connect()
    
    console.log('Seeding Users...')
    for (const u of MOCK_USERS) {
      await client.query(`
        INSERT INTO "public"."user" (id, name, age, gender, location, bio, intention, interests, traits, lifestyle, phone, email, password, verified, onboarded, online)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (email) DO NOTHING
      `, [u.id, u.name, u.age, u.gender, u.location, u.bio, u.intention, u.interests, u.traits, u.lifestyle, u.phone, u.email, u.password, u.verified, u.onboarded, true])
    }

    console.log('Seeding Photos...')
    for (const p of MOCK_PHOTOS) {
      await client.query(`
        INSERT INTO "public"."photo" (id, "userId", url, "order", "isPrimary", moderation)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 'approved')
      `, [p.userId, p.url, p.order, p.isPrimary])
    }

    console.log('Database seeding completed successfully.')
  } catch (err) {
    console.error('Failed to seed:', err)
  } finally {
    await client.end()
  }
}

seed()
