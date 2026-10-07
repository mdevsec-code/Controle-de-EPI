import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@epi-manager/contracts";
import { prisma } from "@epi-manager/database";
import { AppError, forbidden, unauthenticated } from "../errors.js";
import { jwtTokenService } from "../security/token-service.js";
import type { AuthContext } from "./auth-context.js";

/** Carrega usuario + escopo. Exportado para reuso no endpoint /auth/me. */
export async function loadAuthContext(
  userId: string,
  tokenVersion?: number,
): Promise<AuthContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      active: true,
      tokenVersion: true,
      warehouses: { select: { warehouse: { select: { id: true, businessUnitId: true } } } },
    },
  });
  if (!user || !user.active) return null;
  if (tokenVersion !== undefined && user.tokenVersion !== tokenVersion) return null;

  const isAdmin = user.role === "ADMIN";
  const warehouses = user.warehouses.map((link) => link.warehouse);
  return {
    userId: user.id,
    name: user.name,
    role: user.role,
    warehouseIds: isAdmin ? null : warehouses.map((w) => w.id),
    businessUnitIds: isAdmin ? null : [...new Set(warehouses.map((w) => w.businessUnitId))],
  };
}

/**
 * Valida o access token (assinatura, alg, iss, aud, expiracao, claims) e revalida o usuario no
 * banco: desativar o usuario ou mudar seu perfil/senha (tokenVersion) revoga o acesso na hora.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("NAO_AUTENTICADO", 401, "Autenticacao necessaria");
  }

  let claims;
  try {
    claims = jwtTokenService.verifyAccessToken(header.slice("Bearer ".length));
  } catch {
    throw unauthenticated();
  }

  const context = await loadAuthContext(claims.sub, claims.ver);
  if (!context) throw unauthenticated();

  req.auth = context;
  next();
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new AppError("NAO_AUTENTICADO", 401, "Autenticacao necessaria");
    if (!roles.includes(req.auth.role)) throw forbidden();
    next();
  };
}
