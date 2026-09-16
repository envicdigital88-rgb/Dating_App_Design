import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from '../prisma/schema.d';
import contractJson from '../prisma/schema.json' with { type: 'json' };

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof postgres<Contract>> | undefined
}

export const db = globalForPrisma.prisma ?? postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL!,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
