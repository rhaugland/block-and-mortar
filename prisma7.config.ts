import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (Vercel CLI writes here), then .env as fallback
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use unpooled URL for migrations (direct connection needed)
    url: process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"],
  },
});
