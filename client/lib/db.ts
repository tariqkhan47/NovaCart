import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "./load-env";

// Reuse one client across hot reloads in dev and across serverless
// invocations that land on the same instance — same reasoning as the old
// mongoose cache this replaces.
const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  // Read here rather than at module load. `next build` collects page data
  // with no environment loaded, so a module-scope read fails the build on
  // any host that does not inject env vars at build time. The proxy below
  // defers this until the first real query, which only ever happens at
  // request time.
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("Please define the DATABASE_URL environment variable");
  }

  // Explicit small pool: the account's MySQL user is capped at 75 total
  // connections shared across everything on the account, and each
  // long-lived server process holds its pool open for its whole lifetime.
  // The default pool size (10) multiplied across a handful of app instances
  // eats that budget fast — this shop's traffic never needs more than a
  // couple of connections at once.
  const parsed = new URL(url);

  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    connectionLimit: 3,
    idleTimeout: 30,
  });

  return new PrismaClient({ adapter });
}

function getClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
});
