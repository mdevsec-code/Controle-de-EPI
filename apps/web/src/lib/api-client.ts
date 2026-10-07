import type { ApiErrorBody, ErrorCode, SessionResponse } from "@epi-manager/contracts";
import { useSessionStore } from "@/features/auth/session-store";

export type ClientErrorCode = ErrorCode | "REDE";

/** Erro de API com codigo estavel; a UI traduz pelo codigo (ver lib/errors.ts). */
export class ApiError extends Error {
  constructor(
    public readonly code: ClientErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type QueryValue = string | number | boolean | Date | null | undefined;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** Rotas publicas (login/refresh) nao tentam renovar a sessao. */
  auth?: boolean;
}

const BASE = "/api";

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, value instanceof Date ? value.toISOString() : String(value));
  }
  const qs = params.toString();
  return `${BASE}${path}${qs ? `?${qs}` : ""}`;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    if (body.error?.code) {
      return new ApiError(body.error.code, response.status, body.error.message, body.error.details);
    }
  } catch {
    // corpo nao-JSON (ex.: proxy fora do ar)
  }
  return new ApiError("ERRO_INTERNO", response.status, "Resposta inesperada do servidor.");
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Renova a sessao com o cookie httpOnly. Single-flight: varias requisicoes que recebem 401 ao
 * mesmo tempo compartilham UMA chamada de refresh (evita rotacoes concorrentes do token).
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) {
        useSessionStore.getState().clear();
        return false;
      }
      useSessionStore.getState().setSession((await response.json()) as SessionResponse);
      return true;
    } catch {
      // Falha de rede no bootstrap: trata como deslogado (tela de login informa se o servidor voltar).
      useSessionStore.getState().clear();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const token = useSessionStore.getState().accessToken;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "same-origin",
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(
      "REDE",
      0,
      "Sem conexão com o servidor. Verifique a rede e tente novamente.",
    );
  }
}

async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  let response = await send(path, options);
  if (response.status === 401 && options.auth !== false) {
    if (await refreshSession()) {
      response = await send(path, options);
    }
  }
  if (!response.ok) throw await toApiError(response);
  return response;
}

async function json<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, query?: Record<string, QueryValue>, signal?: AbortSignal) =>
    json<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown, options: Pick<RequestOptions, "auth"> = {}) =>
    json<T>(path, { method: "POST", body: body ?? {}, ...options }),
  patch: <T>(path: string, body: unknown) => json<T>(path, { method: "PATCH", body }),
  /** Conteudo binario autenticado (ex.: imagem da assinatura). */
  blob: async (path: string, signal?: AbortSignal) => (await request(path, { signal })).blob(),
};
