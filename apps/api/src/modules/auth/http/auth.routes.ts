import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { loginRateLimiter } from "../../../shared/middlewares/rate-limiters.js";
import { validateBody } from "../../../shared/middlewares/validate.js";
import { bcryptPasswordHasher } from "../../../shared/security/password-hasher.js";
import { jwtTokenService } from "../../../shared/security/token-service.js";
import { LoginUseCase } from "../application/login.use-case.js";
import { LogoutUseCase } from "../application/logout.use-case.js";
import { RefreshTokenUseCase } from "../application/refresh-token.use-case.js";
import { PrismaRefreshTokenRepository } from "../infra/prisma-refresh-token-repository.js";
import { PrismaUserRepository } from "../infra/prisma-user-repository.js";
import { AuthController } from "./auth.controller.js";
import { loginBodySchema } from "./auth.schemas.js";

export function createAuthRouter(): Router {
  const userRepository = new PrismaUserRepository();
  const refreshTokenRepository = new PrismaRefreshTokenRepository();

  const loginUseCase = new LoginUseCase(
    userRepository,
    refreshTokenRepository,
    bcryptPasswordHasher,
    jwtTokenService,
  );
  const refreshTokenUseCase = new RefreshTokenUseCase(
    userRepository,
    refreshTokenRepository,
    jwtTokenService,
  );
  const logoutUseCase = new LogoutUseCase(refreshTokenRepository, jwtTokenService);

  const controller = new AuthController(loginUseCase, refreshTokenUseCase, logoutUseCase);

  const router = Router();

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Autentica um usuario e retorna o access token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, format: email }
   *               password: { type: string, format: password }
   *     responses:
   *       200:
   *         description: Login efetuado com sucesso
   *       401:
   *         description: Credenciais invalidas
   *       422:
   *         description: Erro de validacao
   */
  router.post("/auth/login", loginRateLimiter, validateBody(loginBodySchema), controller.login);

  /**
   * @openapi
   * /auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Emite um novo access token a partir do refresh token (cookie httpOnly)
   *     responses:
   *       200:
   *         description: Novo access token emitido
   *       401:
   *         description: Refresh token ausente, invalido ou expirado
   */
  router.post("/auth/refresh", controller.refresh);

  /**
   * @openapi
   * /auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: Revoga o refresh token atual
   *     responses:
   *       204:
   *         description: Logout efetuado
   */
  router.post("/auth/logout", controller.logout);

  /**
   * @openapi
   * /auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Retorna o usuario autenticado
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Usuario autenticado
   *       401:
   *         description: Nao autenticado
   */
  router.get("/auth/me", authenticate, controller.me);

  return router;
}
