import type {
  CaStatus,
  DeliveryReason,
  DeliveryStatus,
  EmployeeStatus,
  ReturnCondition,
  StockMovementType,
  UserRole,
} from "@epi-manager/contracts";

/** Rotulos de exibicao dos enums do dominio (os valores trafegam sem acento na API). */

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrador",
  ALMOXARIFADO: "Almoxarifado",
};

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  BLOQUEADO: "Bloqueado",
  DESLIGADO: "Desligado",
};

/** Mesmos 8 motivos do legado, na mesma ordem. */
export const DELIVERY_REASON_LABEL: Record<DeliveryReason, string> = {
  DESGASTE: "Desgaste",
  DANO: "Dano",
  ROTINA: "Rotina",
  ATIVIDADE_ESPECIAL: "Atividade especial",
  PERDA: "Perda",
  EXTRAVIO: "Extravio",
  NOVO_COLABORADOR: "Novo colaborador",
  OUTRO: "Outro",
};

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export const MOVEMENT_TYPE_LABEL: Record<StockMovementType, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  ENTREGA: "Entrega",
  DEVOLUCAO: "Devolução",
  AJUSTE: "Ajuste de inventário",
  PERDA: "Perda",
  AVARIA: "Avaria",
};

export const RETURN_CONDITION_LABEL: Record<ReturnCondition, string> = {
  BOM: "Bom estado (volta ao estoque)",
  DANIFICADO: "Danificado",
  DESCARTADO: "Descartado",
};

export const CA_STATUS_LABEL: Record<CaStatus, string> = {
  VIGENTE: "Vigente",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
};

export function sizeLabel(size: string): string {
  return size ? `Tam. ${size}` : "";
}
