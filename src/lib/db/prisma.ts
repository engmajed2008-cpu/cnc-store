/**
 * src/lib/db/prisma.ts
 * Singleton Prisma client — prevents connection pool exhaustion in development
 * (Next.js hot-reload creates new module instances on every change)
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

// Lazy proxy: the real client is only constructed on first use, so importing
// this module during `next build` (page-data collection) never touches Prisma.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? (value as Function).bind(client) : value;
  },
});

export default prisma;
