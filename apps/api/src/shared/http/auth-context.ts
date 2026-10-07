import type { UserRole } from "@epi-manager/contracts";

/** Usuario autenticado + escopo de dados derivado dos almoxarifados vinculados. */
export interface AuthContext {
  userId: string;
  name: string;
  role: UserRole;
  /** Almoxarifados acessiveis; `null` = todos (ADMIN). */
  warehouseIds: string[] | null;
  /** Unidades acessiveis (as dos almoxarifados); `null` = todas (ADMIN). */
  businessUnitIds: string[] | null;
}
