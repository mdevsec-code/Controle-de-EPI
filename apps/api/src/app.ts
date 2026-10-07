import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Router } from "express";
import helmet from "helmet";
import { createAuthRouter } from "./modules/auth/http/auth.routes.js";
import { createDeliveriesRouter } from "./modules/deliveries/deliveries.routes.js";
import { createEmployeesRouter } from "./modules/employees/employees.routes.js";
import { createEpisRouter } from "./modules/epis/epis.routes.js";
import { createOrganizationRouter } from "./modules/organization/organization.routes.js";
import { createStockRouter } from "./modules/stock/stock.routes.js";
import { createUsersRouter } from "./modules/users/users.routes.js";
import { createWarehousesRouter } from "./modules/warehouses/warehouses.routes.js";
import { env } from "./shared/env.js";
import { errorHandler, notFoundHandler } from "./shared/http/error-handler.js";
import { globalRateLimiter } from "./shared/http/rate-limiters.js";

export function createApp() {
  const app = express();

  // Necessario para req.ip correto (rate limit, auditoria) atras de proxy reverso.
  app.set("trust proxy", env.TRUST_PROXY);
  app.disable("x-powered-by");

  app.use(helmet());
  if (env.CORS_ORIGIN) {
    app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  }
  // A assinatura (PNG em base64) so trafega no registro de entrega; o resto da API usa limite baixo.
  app.use("/api/deliveries", express.json({ limit: "512kb" }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use("/api", globalRateLimiter);

  const api = Router();
  api.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  api.use(createAuthRouter());
  api.use(createUsersRouter());
  api.use(createOrganizationRouter());
  api.use(createWarehousesRouter());
  api.use(createEmployeesRouter());
  api.use(createEpisRouter());
  api.use(createStockRouter());
  api.use(createDeliveriesRouter());

  app.use("/api", api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
