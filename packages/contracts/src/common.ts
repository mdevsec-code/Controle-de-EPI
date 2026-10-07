import { z } from "zod";
import { PAGE_SIZE_MAX } from "./rules.js";

export const idSchema = z.uuid("Identificador invalido");
export const idParamSchema = z.object({ id: idSchema });

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).default(20),
});
export type PageQuery = z.infer<typeof pageQuerySchema>;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Texto opcional: string vazia vira undefined (formularios enviam ""). */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const requiredText = (min: number, max: number) => z.string().trim().min(min).max(max);

/** Datas trafegam como string ISO-8601. */
export type IsoDateString = string;

export interface NamedRef {
  id: string;
  name: string;
}
