import { defineConfig } from "vitest/config";

/**
 * Testes de integracao contra PostgreSQL REAL (concorrencia, constraints, transacoes, HTTP).
 * Requer TEST_DATABASE_URL apontando para um banco descartavel: as tabelas sao truncadas.
 *
 *   TEST_DATABASE_URL=postgresql://... pnpm --filter @epi-manager/api test:integration
 */
const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error(
    "Defina TEST_DATABASE_URL (banco descartavel) para rodar os testes de integracao.",
  );
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/integration/**/*.int.spec.ts"],
    globalSetup: ["test/integration/global-setup.ts"],
    // Um arquivo por vez: todos compartilham o mesmo banco.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: url,
      JWT_SECRET: "integration-test-secret-0123456789abcdef",
    },
  },
});
