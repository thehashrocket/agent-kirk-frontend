/**
 * @file src/lib/prisma.ts
 * Prisma client singleton setup for database access.
 * Implements best practices for Next.js by maintaining a single Prisma instance.
 * 
 * Features:
 * - Singleton pattern implementation
 * - Hot reload support in development
 * - Type-safe database access
 * - Proper connection management
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/prisma/generated/client';

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Exports a singleton instance of PrismaClient.
 * Reuses existing instance in global scope if available,
 * otherwise creates a new instance.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Saves the Prisma instance to the global scope in development.
 * This prevents multiple instances during hot reloading.
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { Prisma } from '@/prisma/generated/client';
