// Valores espelham os enums do schema Prisma. Rotulos de exibicao ficam na UI.

export const USER_ROLES = ["ADMIN", "ALMOXARIFADO"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EMPLOYEE_STATUSES = ["ATIVO", "INATIVO", "BLOQUEADO", "DESLIGADO"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const DELIVERY_STATUSES = ["CONCLUIDA", "CANCELADA"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const DELIVERY_REASONS = [
  "DESGASTE",
  "DANO",
  "ROTINA",
  "ATIVIDADE_ESPECIAL",
  "PERDA",
  "EXTRAVIO",
  "NOVO_COLABORADOR",
  "OUTRO",
] as const;
export type DeliveryReason = (typeof DELIVERY_REASONS)[number];

export const STOCK_MOVEMENT_TYPES = [
  "ENTRADA",
  "SAIDA",
  "ENTREGA",
  "DEVOLUCAO",
  "AJUSTE",
  "PERDA",
  "AVARIA",
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const RETURN_CONDITIONS = ["BOM", "DANIFICADO", "DESCARTADO"] as const;
export type ReturnCondition = (typeof RETURN_CONDITIONS)[number];

export const CA_STATUSES = ["VIGENTE", "VENCIDO", "CANCELADO"] as const;
export type CaStatus = (typeof CA_STATUSES)[number];
