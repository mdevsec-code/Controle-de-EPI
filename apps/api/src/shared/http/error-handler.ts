import type { NextFunction, Request, Response } from "express";
import type { ApiErrorBody, ErrorCode } from "@epi-manager/contracts";
import { Prisma } from "@epi-manager/database";
import { AppError } from "../errors.js";
import { logger } from "../logger.js";

function send(res: Response, status: number, code: ErrorCode, message: string, details?: unknown) {
  const body: ApiErrorBody = {
    error: { code, message, ...(details === undefined ? {} : { details }) },
  };
  res.status(status).json(body);
}

function isBodyParserError(err: unknown): err is { type: string; status: number } {
  return typeof err === "object" && err !== null && "type" in err && "status" in err;
}

/**
 * Converte qualquer erro em resposta estruturada. Detalhes internos (stack, SQL) vao so para
 * o log; o cliente recebe codigo estavel + mensagem util.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return send(res, err.status, err.code, err.message, err.details);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        // Violacao de unicidade que escapou da checagem previa (corrida entre requisicoes).
        return send(res, 409, "CONFLITO", "Ja existe um registro com estes dados.", {
          fields: err.meta?.target,
        });
      case "P2025":
        return send(res, 404, "NAO_ENCONTRADO", "Registro nao encontrado.");
      case "P2003":
        return send(res, 409, "CONFLITO", "Operacao viola um vinculo com outro registro.");
    }
  }

  if (isBodyParserError(err)) {
    if (err.type === "entity.too.large") {
      return send(res, 413, "VALIDACAO", "Conteudo enviado excede o tamanho permitido.");
    }
    if (err.type === "entity.parse.failed") {
      return send(res, 400, "VALIDACAO", "Corpo da requisicao nao e um JSON valido.");
    }
  }

  logger.error("Erro nao tratado", {
    method: req.method,
    path: req.path,
    error: err instanceof Error ? err.stack : String(err),
  });
  return send(
    res,
    500,
    "ERRO_INTERNO",
    "Erro interno. Tente novamente; se persistir, contate o suporte.",
  );
}

export function notFoundHandler(_req: Request, res: Response) {
  send(res, 404, "ROTA_NAO_ENCONTRADA", "Rota nao encontrada.");
}
