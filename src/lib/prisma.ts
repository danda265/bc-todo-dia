import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, Pool } from "@neondatabase/serverless";

// Em produção no Vercel, usar WebSockets para melhor performance serverless
if (process.env.NODE_ENV === "production") {
  const ws = require("ws");
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function makePrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada");
  }

  const pool = new Pool({ connectionString } as any);
  const adapter = new PrismaNeon(pool as any);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
