import { createApp } from "./app.js";
import { env } from "./shared/env.js";
import { logger } from "./shared/logger.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`API disponivel em http://localhost:${env.PORT}`);
});
