import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

// Usa HTTP (fetch) ao invés de WebSocket (Pool).
// WebSocket connections morrem no cold-start serverless do Vercel —
// o Pool fica stale e a primeira query após inatividade falha.
// HTTP via neon() é stateless: cada query é um fetch independente.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function makePrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não configurada");

  const sql = neon(connectionString);
  const adapter = new PrismaNeon(sql as any);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
