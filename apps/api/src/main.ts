import { prisma } from "@epi-manager/database";
import { createApp } from "./app.js";
import { env } from "./shared/env.js";
import { logger } from "./shared/logger.js";

const server = createApp().listen(env.PORT, () => {
  logger.info(`API disponivel em http://localhost:${env.PORT}/api`);
});

function shutdown(signal: string) {
  logger.info(`${signal} recebido, encerrando...`);
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
