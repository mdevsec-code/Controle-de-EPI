import { Prisma, prisma, type Tx } from "@epi-manager/database";

/** Acoes auditadas. Lista fechada para facilitar consultas e evitar grafias divergentes. */
export type AuditAction =
  | "LOGIN_SUCESSO"
  | "LOGIN_FALHA"
  | "LOGIN_BLOQUEADO"
  | "LOGOUT"
  | "SESSAO_REUSO_DETECTADO"
  | "SENHA_ALTERADA"
  | "SENHA_REDEFINIDA"
  | "CRIAR"
  | "ATUALIZAR"
  | "ALTERAR_STATUS"
  | "ALTERAR_PERMISSOES"
  | "REEMITIR_CRACHA"
  | "CANCELAR_CA"
  | "ESTOQUE_ENTRADA"
  | "ESTOQUE_AJUSTE"
  | "ENTREGA_REGISTRADA"
  | "DEVOLUCAO_REGISTRADA";

export interface AuditEntry {
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  // Remove Date/BigInt/Decimal via round-trip JSON; nunca armazenar hashes de senha aqui.
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Registra a auditoria. Passe `tx` para gravar na MESMA transacao da operacao auditada
 * (se a operacao falhar, o registro tambem nao fica).
 */
export async function recordAudit(entry: AuditEntry, tx: Tx = prisma): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      before: toJson(entry.before),
      after: toJson(entry.after),
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    },
  });
}
