import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Bump this when AuditReport (or other models) gain fields.
 * Next.js HMR keeps PrismaClient on globalThis, so a client constructed
 * before `prisma generate` would otherwise reject new select fields.
 */
const PRISMA_RUNTIME_ID = "growth-sprint-1-measurement-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaRuntimeId?: string;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaRuntimeId !== PRISMA_RUNTIME_ID
  ) {
    void globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }

  const client = globalForPrisma.prisma ?? createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaRuntimeId = PRISMA_RUNTIME_ID;
  }

  return client;
}

export const prisma = getPrismaClient();
