import { z } from "zod";

export const createCompanyBodySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  tradeName: z.string().min(2).optional(),
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve conter 14 digitos numericos"),
  responsibleName: z.string().min(2).optional(),
  responsibleEmail: z.string().email().optional(),
});

export const updateCompanyBodySchema = createCompanyBodySchema.partial().omit({ cnpj: true });
