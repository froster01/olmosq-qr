import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrations need a direct connection (no pgbouncer)
// Runtime queries use DATABASE_URL (pooler is fine)
const migrationUrl =
  process.env["DIRECT_URL"] || process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
});
