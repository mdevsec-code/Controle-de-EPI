import { z } from "zod";
import {
  idSchema,
  optionalText,
  pageQuerySchema,
  type IsoDateString,
  type NamedRef,
} from "./common.js";
import {
  DELIVERY_REASONS,
  DELIVERY_STATUSES,
  RETURN_CONDITIONS,
  type DeliveryReason,
  type DeliveryStatus,
  type ReturnCondition,
} from "./enums.js";
import type { EmployeeSummaryDto } from "./employees.js";
import {
  DELIVERY_NOTES_MAX_LENGTH,
  ITEM_NOTES_MAX_LENGTH,
  MAX_DELIVERY_ITEMS,
  MAX_ITEM_QUANTITY,
  SIGNATURE_MAX_BYTES,
} from "./rules.js";

export const SIGNATURE_DATA_URL_PREFIX = "data:image/png;base64,";
const SIGNATURE_MAX_DATA_URL_LENGTH =
  SIGNATURE_DATA_URL_PREFIX.length + Math.ceil(SIGNATURE_MAX_BYTES / 3) * 4;

export const deliveryItemRequestSchema = z.object({
  /** O item de estoque identifica EPI + tamanho + lote + almoxarifado. */
  stockItemId: idSchema,
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Quantidade minima: 1")
    .max(MAX_ITEM_QUANTITY, `Quantidade maxima por EPI: ${MAX_ITEM_QUANTITY}`),
  notes: optionalText(ITEM_NOTES_MAX_LENGTH),
});
export type DeliveryItemRequest = z.input<typeof deliveryItemRequestSchema>;

export const createDeliveryRequestSchema = z
  .object({
    /** Gerado pelo cliente ao iniciar o fluxo: reenvios nao duplicam a entrega. */
    idempotencyKey: idSchema,
    employeeId: idSchema,
    warehouseId: idSchema,
    reason: z.enum(DELIVERY_REASONS),
    reasonDetail: optionalText(200),
    notes: optionalText(DELIVERY_NOTES_MAX_LENGTH),
    items: z
      .array(deliveryItemRequestSchema)
      .min(1, "Selecione ao menos um EPI")
      .max(MAX_DELIVERY_ITEMS)
      .refine(
        (items) => new Set(items.map((item) => item.stockItemId)).size === items.length,
        "O mesmo item de estoque aparece mais de uma vez",
      ),
    signature: z
      .string()
      .startsWith(SIGNATURE_DATA_URL_PREFIX, "Assinatura deve ser uma imagem PNG")
      .max(SIGNATURE_MAX_DATA_URL_LENGTH, "Assinatura muito grande"),
  })
  .refine((data) => data.reason !== "OUTRO" || data.reasonDetail, {
    message: "Descreva o motivo",
    path: ["reasonDetail"],
  });
export type CreateDeliveryRequest = z.input<typeof createDeliveryRequestSchema>;

export const listDeliveriesQuerySchema = pageQuerySchema.extend({
  /** Nome ou matricula do colaborador. */
  q: z.string().trim().max(100).optional(),
  employeeId: idSchema.optional(),
  warehouseId: idSchema.optional(),
  status: z.enum(DELIVERY_STATUSES).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
/** Parametros enviados pelo cliente (valores ja tipados; o cliente HTTP serializa). */
export type ListDeliveriesQuery = Partial<z.output<typeof listDeliveriesQuerySchema>>;

export interface DeliveryListItemDto {
  id: string;
  number: number;
  status: DeliveryStatus;
  deliveredAt: IsoDateString;
  employeeName: string;
  employeeRegistration: string;
  items: { epiName: string; quantity: number }[];
  totalQuantity: number;
}

export interface DeliveryItemDto {
  id: string;
  epiItemId: string;
  epiName: string;
  caNumber: string;
  size: string;
  batchNumber: string;
  quantity: number;
  returnedQuantity: number;
  notes: string | null;
  expectedReplacementAt: IsoDateString | null;
}

export interface DeliveryDto {
  id: string;
  number: number;
  status: DeliveryStatus;
  reason: DeliveryReason;
  reasonDetail: string | null;
  notes: string | null;
  deliveredAt: IsoDateString;
  employee: EmployeeSummaryDto;
  warehouse: NamedRef;
  deliveredBy: NamedRef;
  items: DeliveryItemDto[];
  signature: { signedAt: IsoDateString; contentHash: string } | null;
}

export const createReturnRequestSchema = z.object({
  deliveryItemId: idSchema,
  quantity: z.coerce.number().int().min(1).max(MAX_ITEM_QUANTITY),
  condition: z.enum(RETURN_CONDITIONS),
  reason: optionalText(200),
});
export type CreateReturnRequest = z.input<typeof createReturnRequestSchema>;

export interface EpiReturnDto {
  id: string;
  deliveryItemId: string;
  quantity: number;
  condition: ReturnCondition;
  reason: string | null;
  restocked: boolean;
  returnedAt: IsoDateString;
}

// --- Dashboard ---------------------------------------------------------------

export interface DashboardSummaryDto {
  today: {
    deliveries: number;
    employeesServed: number;
    epiTypes: number;
  };
  lowStockCount: number;
  /** Itens com saldo que ainda nao tem local de armazenamento marcado. */
  unplacedStockCount: number;
  /** Entregas concluidas por dia util (UTC-3) nos ultimos 7 dias, do mais antigo para hoje. */
  week: { date: string; deliveries: number }[];
  recentDeliveries: DeliveryListItemDto[];
}
