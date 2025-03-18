import { PrismaClient } from '@prisma/client'

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient
}

const prismaClientSingleton = () => {
  return new PrismaClient()
}

const globalWithPrisma = globalThis as GlobalWithPrisma
export const prisma = globalWithPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalWithPrisma.prisma = prisma
} 