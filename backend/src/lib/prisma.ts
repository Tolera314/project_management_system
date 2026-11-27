// src/lib/prisma.ts
import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

// Pool sized for Neon serverless / Render free-tier constraints.
// Neon free tier limits to ~20 concurrent connections; keep max ≤ 10 to leave headroom.
// Increase for paid plans: Starter → 25, Pro → 50+
const pool = new Pool({
  connectionString,
  max: 10,                     // Maximum pool size — tune per your DB plan
  min: 2,                      // Minimum connections kept alive
  idleTimeoutMillis: 30000,    // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Wait max 10 s for a connection
  maxUses: 7500,               // Recycle connections after 7500 uses (prevents leaks)
  ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false
})

pool.on('error', (err) => {
  console.error('[PgPool] Unexpected error on idle client', err);
});

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma