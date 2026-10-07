// Codigos de erro estaveis: o frontend traduz pelo codigo, nunca pelo texto.

export const ERROR_CODES = [
  "VALIDACAO",
  "NAO_AUTENTICADO",
  "SESSAO_EXPIRADA",
  "CREDENCIAIS_INVALIDAS",
  "CONTA_BLOQUEADA",
  "SENHA_ATUAL_INCORRETA",
  "SEM_PERMISSAO",
  "NAO_ENCONTRADO",
  "CONFLITO",
  "ESTOQUE_INSUFICIENTE",
  "COLABORADOR_INDISPONIVEL",
  "CA_INVALIDO",
  "EPI_INATIVO",
  "TRANSICAO_INVALIDA",
  "DEVOLUCAO_EXCEDE_ENTREGUE",
  "MUITAS_TENTATIVAS",
  "ROTA_NAO_ENCONTRADA",
  "ERRO_INTERNO",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    /** VALIDACAO: campo -> mensagens. ESTOQUE_INSUFICIENTE: itens sem saldo. */
    details?: unknown;
  };
}

export interface InsufficientStockDetail {
  stockItemId: string;
  epiName: string;
  requested: number;
  available: number;
}
