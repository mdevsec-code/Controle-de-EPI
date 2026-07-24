import { z } from "zod";

const controlTypeSchema = z.enum(["LOTE", "PATRIMONIO", "INDIVIDUAL"]);

export const createEpiItemBodySchema = z.object({
  name: z.string().min(2),
  internalCode: z.string().min(1).max(40),
  barcode: z.string().optional(),
  category: z.string().min(2),
  manufacturer: z.string().min(2),
  model: z.string().optional(),
  controlType: controlTypeSchema,
  photoUrl: z.string().url().optional(),
  manualUrl: z.string().url().optional(),
  minQuantity: z.coerce.number().int().min(0).optional(),
  maxQuantity: z.coerce.number().int().min(0).optional(),
  unitValue: z.coerce.number().min(0).optional(),
  usefulLifeDays: z.coerce.number().int().min(1).optional(),
});

export const updateEpiItemBodySchema = createEpiItemBodySchema.partial().omit({ internalCode: true });

export const listEpiItemQuerySchema = z.object({
  category: z.string().optional(),
});
