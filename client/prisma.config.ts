// Used by the Prisma CLI (`prisma migrate`, `prisma generate`, ...), not by
// the running app — the app builds its own adapter in lib/db.ts. Loads
// .env.local rather than .env because that's where this project's secrets
// already live (see client/.env.local).
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
