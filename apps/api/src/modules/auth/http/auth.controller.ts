import type { CookieOptions, Request, Response } from "express";
import { env } from "../../../shared/env.js";
import { AppError } from "../../../shared/middlewares/error-handler.js";
import type { LoginUseCase } from "../application/login.use-case.js";
import type { LogoutUseCase } from "../application/logout.use-case.js";
import type { RefreshTokenUseCase } from "../application/refresh-token.use-case.js";
import type { LoginBody } from "./auth.schemas.js";

export const REFRESH_COOKIE_NAME = "epi_manager_refresh_token";

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginBody;
    const result = await this.loginUseCase.execute({ email, password });

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());
    res.status(200).json({ accessToken: result.accessToken, user: result.user });
  };

  refresh = async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      throw new AppError("Refresh token ausente", 401);
    }

    const result = await this.refreshTokenUseCase.execute(token);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());
    res.status(200).json({ accessToken: result.accessToken });
  };

  logout = async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      await this.logoutUseCase.execute(token);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/auth" });
    res.status(204).send();
  };

  me = async (req: Request, res: Response) => {
    res.status(200).json({ user: req.user });
  };
}
