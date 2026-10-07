import type { DeliveryDto, DeliveryListItemDto } from "@epi-manager/contracts";
import { prisma, type Prisma } from "@epi-manager/database";
import { iso, isoOrNull } from "../../shared/format.js";
import { employeeInclude, toEmployeeSummary } from "../employees/employee.mapper.js";

const deliveryInclude = {
  employee: { include: employeeInclude },
  warehouse: { select: { id: true, name: true } },
  deliveredBy: { select: { id: true, name: true } },
  items: { include: { returns: { select: { quantity: true } } }, orderBy: { epiName: "asc" } },
  signature: { select: { signedAt: true, contentHash: true } },
} satisfies Prisma.DeliveryInclude;

type DeliveryRow = Prisma.DeliveryGetPayload<{ include: typeof deliveryInclude }>;

function toDeliveryDto(d: DeliveryRow): DeliveryDto {
  return {
    id: d.id,
    number: d.number,
    status: d.status,
    reason: d.reason,
    reasonDetail: d.reasonDetail,
    notes: d.notes,
    deliveredAt: iso(d.deliveredAt),
    employee: toEmployeeSummary(d.employee),
    warehouse: d.warehouse,
    deliveredBy: d.deliveredBy,
    items: d.items.map((item) => ({
      id: item.id,
      epiItemId: item.epiItemId,
      epiName: item.epiName,
      caNumber: item.caNumber,
      size: item.size,
      batchNumber: item.batchNumber,
      quantity: item.quantity,
      returnedQuantity: item.returns.reduce((sum, r) => sum + r.quantity, 0),
      notes: item.notes,
      expectedReplacementAt: isoOrNull(item.expectedReplacementAt),
    })),
    signature: d.signature
      ? { signedAt: iso(d.signature.signedAt), contentHash: d.signature.contentHash }
      : null,
  };
}

export interface FoundDelivery {
  dto: DeliveryDto;
  /** Campos internos para checagem de escopo/autoria (nao vao na resposta). */
  warehouseId: string;
  deliveredById: string;
}

export async function findDelivery(
  where: Prisma.DeliveryWhereUniqueInput,
): Promise<FoundDelivery | null> {
  const row = await prisma.delivery.findUnique({ where, include: deliveryInclude });
  return row
    ? { dto: toDeliveryDto(row), warehouseId: row.warehouseId, deliveredById: row.deliveredById }
    : null;
}

export const deliveryListInclude = {
  employee: { select: { name: true, registration: true } },
  items: { select: { epiName: true, quantity: true }, orderBy: { epiName: "asc" } },
} satisfies Prisma.DeliveryInclude;

export function toDeliveryListItem(
  d: Prisma.DeliveryGetPayload<{ include: typeof deliveryListInclude }>,
): DeliveryListItemDto {
  return {
    id: d.id,
    number: d.number,
    status: d.status,
    deliveredAt: iso(d.deliveredAt),
    employeeName: d.employee.name,
    employeeRegistration: d.employee.registration,
    items: d.items,
    totalQuantity: d.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
