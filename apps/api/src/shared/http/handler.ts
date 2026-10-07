import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z, type ZodType } from "zod";
import { AppError } from "../errors.js";
import type { AuthContext } from "./auth-context.js";

interface Schemas {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
  /** Status HTTP de sucesso (padrao 200). */
  status?: number;
}

type Parsed<T> = T extends ZodType ? z.output<T> : undefined;

export interface HandlerInput<S extends Schemas> {
  params: Parsed<S["params"]>;
  query: Parsed<S["query"]>;
  body: Parsed<S["body"]>;
  req: Request;
  res: Response;
}

function parse(schema: ZodType | undefined, value: unknown, part: string): unknown {
  if (!schema) return undefined;
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError("VALIDACAO", 422, "Dados invalidos. Verifique os campos destacados.", {
      part,
      fields: z.flattenError(result.error).fieldErrors,
      formErrors: z.flattenError(result.error).formErrors,
    });
  }
  return result.data;
}

/**
 * Rota tipada: valida params/query/body com os schemas do contracts, entrega os valores
 * ja convertidos ao handler e serializa o retorno como JSON. Retornar `undefined` com
 * status 204 envia resposta vazia; handlers que escrevem a resposta (ex.: imagem) usam `res`.
 */
export function handler<S extends Schemas, R>(
  schemas: S,
  fn: (input: HandlerInput<S>) => Promise<R> | R,
): RequestHandler {
  return async (req: Request, res: Response, _next: NextFunction) => {
    // Unica conversao de tipo do helper: os valores acabaram de ser validados pelo proprio schema
    // de S, entao correspondem a z.output dele (o TS nao resolve o condicional generico adiado).
    const input = {
      params: parse(schemas.params, req.params, "params"),
      query: parse(schemas.query, req.query, "query"),
      body: parse(schemas.body, req.body, "body"),
      req,
      res,
    } as HandlerInput<S>;
    const result = await fn(input);
    if (res.headersSent) return;
    const status = schemas.status ?? 200;
    if (status === 204 || result === undefined) {
      res.status(status === 200 ? 204 : status).end();
      return;
    }
    res.status(status).json(result);
  };
}

/** Contexto do usuario autenticado; so pode ser usado atras do middleware `authenticate`. */
export function authOf(req: Request): AuthContext {
  if (!req.auth) {
    throw new AppError("NAO_AUTENTICADO", 401, "Autenticacao necessaria");
  }
  return req.auth;
}

/** Autor de uma operacao auditada: usuario autenticado + origem da requisicao. */
export function actor(req: Request): {
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
} {
  return { userId: authOf(req).userId, ...clientInfo(req) };
}

export function clientInfo(req: Request): { ipAddress: string | null; userAgent: string | null } {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.get("user-agent")?.slice(0, 300) ?? null,
  };
}
