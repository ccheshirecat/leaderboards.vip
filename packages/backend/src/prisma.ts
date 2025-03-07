import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : [],
});

export async function withPrisma<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } finally {
    // No need to disconnect after each operation in a serverless environment
    // await prisma.$disconnect();
  }
}

export default prisma; 