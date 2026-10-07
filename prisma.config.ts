import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "database/prisma/schema.prisma",
  migrations: {
    path: "database/prisma/migrations",
    seed: "pnpm --filter @epi-manager/database seed",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
