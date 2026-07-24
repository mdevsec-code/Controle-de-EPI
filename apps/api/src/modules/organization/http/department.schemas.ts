import { z } from "zod";

export const createDepartmentBodySchema = z.object({
  businessUnitId: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().min(1).max(20),
  parentId: z.string().uuid().optional(),
});

export const updateDepartmentBodySchema = z.object({
  name: z.string().min(2).optional(),
  parentId: z.string().uuid().optional(),
});

export const listDepartmentQuerySchema = z.object({
  businessUnitId: z.string().uuid().optional(),
});
