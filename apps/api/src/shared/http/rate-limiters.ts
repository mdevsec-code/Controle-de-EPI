import type { ApiErrorBody } from "@epi-manager/contracts";
import { rateLimit } from "express-rate-limit";
import { env } from "../env.js";

const tooMany: ApiErrorBody = {
  error: {
    code: "MUITAS_TENTATIVAS",
    message: "Muitas requisicoes. Aguarde alguns minutos e tente novamente.",
  },
};

const skip = () => env.NODE_ENV === "test";
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Limites por IP (em memoria: suficiente para uma instancia; com varias instancias, usar store
 * compartilhada). O IP real depende de TRUST_PROXY estar configurado conforme o deploy.
 * A protecao principal contra forca bruta e o bloqueio por CONTA (caso de uso de login, no banco);
 * o limite por IP so freia ataques a muitas contas. Como uma obra costuma sair por um unico IP,
 * os limites sao folgados para nao bloquear colegas legitimos.
 */
export const globalRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooMany,
  skip,
});

/** Tentativas de senha. */
export const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooMany,
  skip,
});

/**
 * Renovacao de sessao: acontece a cada carregamento de pagina e a cada 15 min, entao fica
 * separada do limite de login (recarregar a pagina nao pode consumir tentativas de senha).
 */
export const refreshRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooMany,
  skip,
});
