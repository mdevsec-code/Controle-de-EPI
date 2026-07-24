import { z } from "zod";

export const createEpiCaBodySchema = z.object({
  number: z.string().min(1),
  issuedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  situation: z.enum(["VALIDO", "VENCIDO", "CANCELADO"]).optional(),
});
