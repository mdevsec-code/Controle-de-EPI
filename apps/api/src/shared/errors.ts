import type { ErrorCode } from "@epi-manager/contracts";

/** Erro de negocio/HTTP com codigo estavel; o handler o converte em `{ error: { code, message, details } }`. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (message: string) => new AppError("NAO_ENCONTRADO", 404, message);
export const conflict = (message: string, details?: unknown) =>
  new AppError("CONFLITO", 409, message, details);
export const forbidden = (message = "Sem permissao para acessar este recurso") =>
  new AppError("SEM_PERMISSAO", 403, message);
export const unauthenticated = (message = "Sessao expirada. Entre novamente.") =>
  new AppError("SESSAO_EXPIRADA", 401, message);
export const unprocessable = (code: ErrorCode, message: string, details?: unknown) =>
  new AppError(code, 422, message, details);
