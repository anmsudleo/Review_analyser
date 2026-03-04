import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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

// #region agent log
fetch("http://127.0.0.1:7926/ingest/8c200ea0-aabb-4cb1-b929-53d2dfd3c250", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Debug-Session-Id": "af86e9",
  },
  body: JSON.stringify({
    sessionId: "af86e9",
    runId: "init",
    hypothesisId: "H3",
    location: "lib/prisma.ts:26",
    message: "Prisma client constructed",
    data: {
      hasConnectionString: !!process.env.DATABASE_URL,
    },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

