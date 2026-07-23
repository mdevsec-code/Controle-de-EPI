import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@epi-manager/types";
import { AppError } from "./error-handler.js";

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Nao autenticado", 401);
    }
    if (!roles.includes(req.user.role as UserRole)) {
      throw new AppError("Sem permissao para acessar este recurso", 403);
    }
    next();
  };
}
