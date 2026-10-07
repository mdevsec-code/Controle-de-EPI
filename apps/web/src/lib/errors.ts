import type { InsufficientStockDetail } from "@epi-manager/contracts";
import { ApiError, type ClientErrorCode } from "./api-client";

/** Mensagens por codigo. Codigos de regra de negocio usam a mensagem especifica do servidor. */
const MESSAGES: Partial<Record<ClientErrorCode, string>> = {
  REDE: "Sem conexão com o servidor. Verifique a rede e tente novamente.",
  NAO_AUTENTICADO: "Sua sessão terminou. Entre novamente.",
  SESSAO_EXPIRADA: "Sua sessão terminou. Entre novamente.",
  CREDENCIAIS_INVALIDAS: "E-mail ou senha incorretos.",
  CONTA_BLOQUEADA:
    "Conta bloqueada temporariamente por excesso de tentativas. Aguarde alguns minutos.",
  SENHA_ATUAL_INCORRETA: "A senha atual está incorreta.",
  SEM_PERMISSAO: "Você não tem permissão para esta ação.",
  MUITAS_TENTATIVAS: "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.",
  ERRO_INTERNO:
    "Não foi possível concluir a operação. Tente novamente; se persistir, avise o suporte.",
  ROTA_NAO_ENCONTRADA: "Recurso não encontrado.",
};

function insufficientStockMessage(details: unknown): string | null {
  if (!Array.isArray(details) || details.length === 0) return null;
  const lines = (details as InsufficientStockDetail[]).map(
    (d) => `${d.epiName}: disponível ${d.available}, solicitado ${d.requested}`,
  );
  return `Estoque insuficiente — ${lines.join("; ")}.`;
}

/** Mensagem amigavel para qualquer erro (nunca stack trace). */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "ESTOQUE_INSUFICIENTE") {
      return insufficientStockMessage(error.details) ?? error.message;
    }
    return MESSAGES[error.code] ?? error.message;
  }
  return MESSAGES.ERRO_INTERNO!;
}

/** Erros de campo devolvidos em VALIDACAO (`details.fields`). */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.code !== "VALIDACAO") return {};
  const fields =
    (error.details as { fields?: Record<string, string[] | undefined> } | undefined)?.fields ?? {};
  return Object.fromEntries(
    Object.entries(fields)
      .filter(
        (entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].length > 0,
      )
      .map(([field, messages]) => [field, messages[0] ?? ""]),
  );
}

export function isApiError(error: unknown, code: ClientErrorCode): boolean {
  return error instanceof ApiError && error.code === code;
}
