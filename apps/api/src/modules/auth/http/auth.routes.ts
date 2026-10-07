import {
  changePasswordRequestSchema,
  loginRequestSchema,
  type SessionResponse,
  type SessionUser,
} from "@epi-manager/contracts";
import { Router, type CookieOptions, type Request, type Response } from "express";
import { recordAudit } from "../../../shared/audit.js";
import { isProduction } from "../../../shared/env.js";
import { AppError } from "../../../shared/errors.js";
import { authenticate } from "../../../shared/http/authenticate.js";
import { authOf, clientInfo, handler } from "../../../shared/http/handler.js";
import { loginRateLimiter, refreshRateLimiter } from "../../../shared/http/rate-limiters.js";
import {
  bcryptPasswordHasher,
  dummyPasswordHash,
} from "../../../shared/security/password-hasher.js";
import { jwtTokenService, REFRESH_TOKEN_TTL_MS } from "../../../shared/security/token-service.js";
import { ChangePasswordUseCase } from "../application/change-password.use-case.js";
import { LoginUseCase } from "../application/login.use-case.js";
import { LogoutUseCase } from "../application/logout.use-case.js";
import { RefreshTokenUseCase } from "../application/refresh-token.use-case.js";
import { SessionIssuer } from "../application/session-issuer.js";
import type { IssuedSession } from "../domain/ports.js";
import { PrismaRefreshTokenRepository } from "../infra/prisma-refresh-token-repository.js";
import { PrismaUserRepository } from "../infra/prisma-user-repository.js";

export const REFRESH_COOKIE_NAME = "epi_refresh";
const REFRESH_COOKIE_PATH = "/api/auth";

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    // Web e API no mesmo site (proxy /api): Strict bloqueia o envio em navegacao cruzada (CSRF).
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_MS,
  };
}

function respondWithSession(res: Response, session: IssuedSession): SessionResponse {
  res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, refreshCookieOptions());
  return { accessToken: session.accessToken, expiresIn: session.expiresIn, user: session.user };
}

function readRefreshCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[REFRESH_COOKIE_NAME];
  return typeof value === "string" && value.length > 0 && value.length <= 200 ? value : undefined;
}

export function createAuthRouter(): Router {
  const userRepository = new PrismaUserRepository();
  const refreshTokenRepository = new PrismaRefreshTokenRepository();
  const audit = (entry: Parameters<typeof recordAudit>[0]) => recordAudit(entry);
  const sessionIssuer = new SessionIssuer(userRepository, refreshTokenRepository, jwtTokenService);

  const login = new LoginUseCase(
    userRepository,
    bcryptPasswordHasher,
    sessionIssuer,
    audit,
    dummyPasswordHash,
  );
  const refresh = new RefreshTokenUseCase(
    userRepository,
    refreshTokenRepository,
    jwtTokenService,
    sessionIssuer,
    audit,
  );
  const logout = new LogoutUseCase(refreshTokenRepository, jwtTokenService, audit);
  const changePassword = new ChangePasswordUseCase(
    userRepository,
    refreshTokenRepository,
    bcryptPasswordHasher,
    sessionIssuer,
    audit,
  );

  const router = Router();

  router.post(
    "/auth/login",
    loginRateLimiter,
    handler({ body: loginRequestSchema }, async ({ body, req, res }) =>
      respondWithSession(res, await login.execute(body, clientInfo(req))),
    ),
  );

  router.post(
    "/auth/refresh",
    refreshRateLimiter,
    handler({}, async ({ req, res }) => {
      const token = readRefreshCookie(req);
      if (!token) throw new AppError("SESSAO_EXPIRADA", 401, "Sessao expirada. Entre novamente.");
      try {
        return respondWithSession(res, await refresh.execute(token, clientInfo(req)));
      } catch (error) {
        res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
        throw error;
      }
    }),
  );

  router.post(
    "/auth/logout",
    handler({ status: 204 }, async ({ req, res }) => {
      const token = readRefreshCookie(req);
      if (token) await logout.execute(token, clientInfo(req));
      res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
    }),
  );

  router.get(
    "/auth/me",
    authenticate,
    handler({}, async ({ req }): Promise<SessionUser> => {
      const user = await userRepository.getSessionUser(authOf(req).userId);
      if (!user) throw new AppError("SESSAO_EXPIRADA", 401, "Sessao expirada. Entre novamente.");
      return user;
    }),
  );

  router.post(
    "/auth/change-password",
    authenticate,
    handler({ body: changePasswordRequestSchema }, async ({ body, req, res }) =>
      respondWithSession(
        res,
        await changePassword.execute(authOf(req).userId, body, clientInfo(req)),
      ),
    ),
  );

  return router;
}
