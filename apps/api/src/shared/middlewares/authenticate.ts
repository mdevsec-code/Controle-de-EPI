import type { NextFunction, Request, Response } from "express";
import { jwtTokenService } from "../security/token-service.js";
import { AppError } from "./error-handler.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("Token de acesso ausente", 401);
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwtTokenService.verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new AppError("Token de acesso invalido ou expirado", 401);
  }
}
