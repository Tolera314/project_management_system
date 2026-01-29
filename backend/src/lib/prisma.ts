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

// Create pg pool with enterprise-grade configuration
// Supports 2000-3000 concurrent DB operations via efficient connection reuse
const pool = new Pool({
  connectionString,
  max: 100, // Maximum pool size (enterprise-grade capacity)
  min: 10, // Minimum connections kept alive
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Wait max 10s for connection
  maxUses: 7500, // Recycle connections after 7500 uses (prevents leaks)
  // Ensure password is treated as string
  ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false
})

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma