import { forbidden } from "../errors.js";
import type { AuthContext } from "./auth-context.js";

/**
 * Escopo de dados: ADMIN ve tudo; ALMOXARIFADO so os almoxarifados vinculados e os
 * colaboradores das unidades desses almoxarifados. Aplicado no backend, nunca so na UI.
 */

export function canAccessWarehouse(auth: AuthContext, warehouseId: string): boolean {
  return auth.warehouseIds === null || auth.warehouseIds.includes(warehouseId);
}

export function assertWarehouseAccess(auth: AuthContext, warehouseId: string): void {
  if (!canAccessWarehouse(auth, warehouseId)) {
    throw forbidden("Voce nao tem acesso a este almoxarifado");
  }
}

export function canAccessBusinessUnit(auth: AuthContext, businessUnitId: string): boolean {
  return auth.businessUnitIds === null || auth.businessUnitIds.includes(businessUnitId);
}

/** Filtro Prisma `{ in: [...] }` ou `undefined` (sem restricao). */
export function warehouseFilter(auth: AuthContext): { in: string[] } | undefined {
  return auth.warehouseIds === null ? undefined : { in: auth.warehouseIds };
}

export function businessUnitFilter(auth: AuthContext): { in: string[] } | undefined {
  return auth.businessUnitIds === null ? undefined : { in: auth.businessUnitIds };
}
