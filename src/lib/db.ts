import "server-only";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

// ── Raw PG pool (used by existing auth system) ──
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada");
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ── Prisma Client (used by appointments system) ──
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
