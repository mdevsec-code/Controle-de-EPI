import type { EmployeeStatus } from "@epi-manager/contracts";

/** Transicoes permitidas. DESLIGADO -> ATIVO representa readmissao. */
const TRANSITIONS: Record<EmployeeStatus, readonly EmployeeStatus[]> = {
  ATIVO: ["INATIVO", "BLOQUEADO", "DESLIGADO"],
  INATIVO: ["ATIVO", "DESLIGADO"],
  BLOQUEADO: ["ATIVO", "DESLIGADO"],
  DESLIGADO: ["ATIVO"],
};

export function canTransition(from: EmployeeStatus, to: EmployeeStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Somente colaborador ATIVO pode receber EPI. */
export function canReceiveEpi(status: EmployeeStatus): boolean {
  return status === "ATIVO";
}
