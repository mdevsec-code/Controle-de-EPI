import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().email("E-mail invalido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
