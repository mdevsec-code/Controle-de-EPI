import { z } from "zod";
import { idSchema, optionalText, pageQuerySchema, type IsoDateString } from "./common.js";
import { STOCK_MOVEMENT_TYPES, type StockMovementType } from "./enums.js";

const sizeSchema = z.string().trim().max(10).toUpperCase().default("");
const batchSchema = z.string().trim().max(40).default("");

/** Limite do texto do local de armazenamento (o banco tem a mesma CHECK). */
export const STOCK_LOCATION_MAX_LENGTH = 60;
const locationSchema = z.string().trim().max(STOCK_LOCATION_MAX_LENGTH);

export const listStockQuerySchema = pageQuerySchema.extend({
  warehouseId: idSchema.optional(),
  epiItemId: idSchema.optional(),
  /** Busca pelo nome/codigo do EPI ou pelo local de armazenamento. */
  q: z.string().trim().max(100).optional(),
  /** Somente itens com saldo > 0 (usado no fluxo de entrega). */
  available: z.stringbool().optional(),
  /** Somente itens com saldo abaixo do minimo do EPI. */
  lowStock: z.stringbool().optional(),
});
/** Parametros enviados pelo cliente (valores ja tipados; o cliente HTTP serializa). */
export type ListStockQuery = Partial<z.output<typeof listStockQuerySchema>>;

export interface StockItemDto {
  id: string;
  warehouseId: string;
  warehouseName: string;
  epiItemId: string;
  epiName: string;
  /** Modelo do EPI (ex.: fabricante/linha); null quando nao informado. */
  model: string | null;
  internalCode: string;
  categoryName: string;
  size: string;
  batchNumber: string;
  /** Local de armazenamento no almoxarifado; vazio = nao definido. */
  location: string;
  quantity: number;
  minQuantity: number;
  /** null quando o EPI nao tem CA vigente (nao pode ser entregue). */
  caNumber: string | null;
}

/** Entrada de material (compra/recebimento). Cria o item de estoque se nao existir. */
export const stockEntryRequestSchema = z.object({
  warehouseId: idSchema,
  epiItemId: idSchema,
  size: sizeSchema,
  batchNumber: batchSchema,
  quantity: z.coerce.number().int().min(1).max(1_000_000),
  reason: optionalText(200),
  /** Onde o material foi guardado. Omitido = mantem o local atual do item. */
  location: locationSchema.optional(),
});
export type StockEntryRequest = z.input<typeof stockEntryRequestSchema>;

/**
 * Saida avulsa (SAIDA/PERDA/AVARIA) informa a quantidade retirada;
 * AJUSTE (inventario) informa o saldo contado e o sistema calcula a diferenca.
 */
export const stockAdjustmentRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["SAIDA", "PERDA", "AVARIA"]),
    stockItemId: idSchema,
    quantity: z.coerce.number().int().min(1).max(1_000_000),
    reason: z.string().trim().min(3, "Informe o motivo").max(200),
  }),
  z.object({
    type: z.literal("AJUSTE"),
    stockItemId: idSchema,
    countedQuantity: z.coerce.number().int().min(0).max(1_000_000),
    reason: z.string().trim().min(3, "Informe o motivo").max(200),
  }),
]);
export type StockAdjustmentRequest = z.input<typeof stockAdjustmentRequestSchema>;

/** Define/limpa o local de armazenamento de um item de estoque. */
export const updateStockLocationRequestSchema = z.object({ location: locationSchema });
export type UpdateStockLocationRequest = z.input<typeof updateStockLocationRequestSchema>;

export const stockLocationsQuerySchema = z.object({ warehouseId: idSchema });

export const listMovementsQuerySchema = pageQuerySchema.extend({
  warehouseId: idSchema.optional(),
  epiItemId: idSchema.optional(),
  stockItemId: idSchema.optional(),
  type: z.enum(STOCK_MOVEMENT_TYPES).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
/** Parametros enviados pelo cliente (valores ja tipados; o cliente HTTP serializa). */
export type ListMovementsQuery = Partial<z.output<typeof listMovementsQuerySchema>>;

export interface StockMovementDto {
  id: string;
  type: StockMovementType;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string | null;
  performedByName: string;
  createdAt: IsoDateString;
  stockItemId: string;
  epiName: string;
  size: string;
  batchNumber: string;
  warehouseName: string;
  deliveryId: string | null;
  deliveryNumber: number | null;
}
