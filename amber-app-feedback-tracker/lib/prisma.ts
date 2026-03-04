import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const rawUrl = process.env.DATABASE_URL;
// Strip query params like ?sslmode=require so we can control TLS via `ssl` below
const connectionString = rawUrl ? rawUrl.split("?")[0] : undefined;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}


