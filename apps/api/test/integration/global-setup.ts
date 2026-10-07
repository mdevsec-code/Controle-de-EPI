import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** Aplica as migrations versionadas (as mesmas de producao) no banco de teste. */
export default function setup() {
  const root = fileURLToPath(new URL("../../../../", import.meta.url));
  execSync("pnpm exec prisma migrate deploy", {
    cwd: root,
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
