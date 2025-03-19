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

import { PrismaClient } from '@prisma/client'

/**
 * Type extension for the global object to include Prisma client.
 * This enables proper typing for the global singleton instance.
 */
type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient
}

/**
 * Creates a new Prisma client instance.
 * Used as a factory function for the singleton pattern.
 * 
 * @returns {PrismaClient} A new Prisma client instance
 */
const prismaClientSingleton = () => {
  return new PrismaClient()
}

const globalWithPrisma = globalThis as GlobalWithPrisma

/**
 * Exports a singleton instance of PrismaClient.
 * Reuses existing instance in global scope if available,
 * otherwise creates a new instance.
 */
export const prisma = globalWithPrisma.prisma ?? prismaClientSingleton()

/**
 * Saves the Prisma instance to the global scope in development.
 * This prevents multiple instances during hot reloading.
 */
if (process.env.NODE_ENV !== 'production') {
  globalWithPrisma.prisma = prisma
} 