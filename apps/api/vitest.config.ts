import { defineConfig } from "vitest/config";

/** Testes unitarios: sem banco, rapidos. Integracao fica em vitest.integration.config.ts. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://unit:unit@localhost:1/unit",
      JWT_SECRET: "unit-test-secret-0123456789abcdef0123",
    },
  },
});
