import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { healthRouter } from "./modules/health/health.routes.js";
import { createAuthRouter } from "./modules/auth/http/auth.routes.js";
import { createBusinessUnitRouter } from "./modules/organization/http/business-unit.routes.js";
import { createCompanyRouter } from "./modules/organization/http/company.routes.js";
import { createDepartmentRouter } from "./modules/organization/http/department.routes.js";
import { createJobRoleRouter } from "./modules/organization/http/job-role.routes.js";
import { env } from "./shared/env.js";
import { errorHandler } from "./shared/middlewares/error-handler.js";
import { notFoundHandler } from "./shared/middlewares/not-found.js";
import { swaggerSpec } from "./shared/swagger.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(healthRouter);
  app.use(createAuthRouter());
  app.use(createCompanyRouter());
  app.use(createBusinessUnitRouter());
  app.use(createDepartmentRouter());
  app.use(createJobRoleRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
