// src/lib/prisma.ts
import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import * as PrismaPkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const PrismaClient = (PrismaPkg as any).PrismaClient

const globalForPrisma = global as unknown as { prisma: any }

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

// Create pg pool with explicit configuration
const pool = new Pool({
  connectionString,
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