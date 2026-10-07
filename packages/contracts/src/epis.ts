import { z } from "zod";
import {
  idSchema,
  optionalText,
  pageQuerySchema,
  requiredText,
  type IsoDateString,
} from "./common.js";
import type { CaStatus } from "./enums.js";

export const createEpiCategoryRequestSchema = z.object({ name: requiredText(2, 80) });
export type CreateEpiCategoryRequest = z.input<typeof createEpiCategoryRequestSchema>;

export interface EpiCategoryDto {
  id: string;
  name: string;
}

export const createEpiRequestSchema = z.object({
  name: requiredText(2, 120),
  internalCode: requiredText(1, 40),
  barcode: optionalText(64),
  categoryId: idSchema,
  manufacturer: requiredText(2, 120),
  model: optionalText(120),
  photoUrl: z.url().optional(),
  manualUrl: z.url().optional(),
  minQuantity: z.coerce.number().int().min(0).max(1_000_000).optional(),
  unitPriceCents: z.coerce.number().int().min(0).max(100_000_000).optional(),
  usefulLifeDays: z.coerce.number().int().min(1).max(36_500).optional(),
});
export type CreateEpiRequest = z.input<typeof createEpiRequestSchema>;

export const updateEpiRequestSchema = createEpiRequestSchema
  .omit({ internalCode: true })
  .extend({ active: z.boolean() })
  .partial();
export type UpdateEpiRequest = z.input<typeof updateEpiRequestSchema>;

export const listEpisQuerySchema = pageQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
  categoryId: idSchema.optional(),
  active: z.stringbool().optional(),
});
/** Parametros enviados pelo cliente (valores ja tipados; o cliente HTTP serializa). */
export type ListEpisQuery = Partial<z.output<typeof listEpisQuerySchema>>;

export interface CurrentCaDto {
  number: string;
  expiresAt: IsoDateString;
}

export interface EpiDto {
  id: string;
  name: string;
  internalCode: string;
  barcode: string | null;
  categoryId: string;
  categoryName: string;
  manufacturer: string;
  model: string | null;
  photoUrl: string | null;
  manualUrl: string | null;
  minQuantity: number;
  unitPriceCents: number | null;
  usefulLifeDays: number | null;
  active: boolean;
  /** CA vigente (nao cancelado e dentro da validade); null bloqueia entrega. */
  currentCa: CurrentCaDto | null;
}

export const createCaRequestSchema = z
  .object({
    number: requiredText(1, 20),
    issuedAt: z.coerce.date(),
    expiresAt: z.coerce.date(),
  })
  .refine((data) => data.expiresAt > data.issuedAt, {
    message: "A validade deve ser posterior a emissao",
    path: ["expiresAt"],
  });
export type CreateCaRequest = z.input<typeof createCaRequestSchema>;

export interface CaDto {
  id: string;
  number: string;
  issuedAt: IsoDateString;
  expiresAt: IsoDateString;
  cancelledAt: IsoDateString | null;
  status: CaStatus;
}
