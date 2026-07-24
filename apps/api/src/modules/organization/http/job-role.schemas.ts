import { z } from "zod";

export const createJobRoleBodySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const updateJobRoleBodySchema = createJobRoleBodySchema.partial();
