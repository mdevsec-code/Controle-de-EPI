import { z } from "zod";

export const createBusinessUnitBodySchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().min(1).max(20),
  street: z.string().optional(),
  number: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().optional(),
});

export const updateBusinessUnitBodySchema = createBusinessUnitBodySchema
  .partial()
  .omit({ companyId: true, code: true });

export const listBusinessUnitQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
});
