import { z } from "zod";
import { idSchema, type IsoDateString, type NamedRef } from "./common.js";
import { USER_ROLES, type UserRole } from "./enums.js";
import { PASSWORD_MIN_LENGTH } from "./rules.js";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email("E-mail invalido"));

const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(200);

// --- Sessao -----------------------------------------------------------------

export const loginRequestSchema = z.object({
  email: emailSchema,
  // Sem politica de senha no login: a politica vale so para criar/trocar senha.
  password: z.string().min(1, "Informe a senha").max(200),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  warehouses: NamedRef[];
}

/** Resposta de login e de refresh (o refresh tambem devolve o usuario para o bootstrap do app). */
export interface SessionResponse {
  accessToken: string;
  /** Segundos ate o access token expirar. */
  expiresIn: number;
  user: SessionUser;
}

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: newPasswordSchema,
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

// --- Usuarios (ADMIN) --------------------------------------------------------

export const createUserRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  role: z.enum(USER_ROLES),
  password: newPasswordSchema,
  warehouseIds: z.array(idSchema).max(50).default([]),
});
export type CreateUserRequest = z.input<typeof createUserRequestSchema>;

export const updateUserRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    role: z.enum(USER_ROLES),
    active: z.boolean(),
    warehouseIds: z.array(idSchema).max(50),
  })
  .partial();
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export const resetPasswordRequestSchema = z.object({ password: newPasswordSchema });
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
  lockedUntil: IsoDateString | null;
  lastLoginAt: IsoDateString | null;
  warehouses: NamedRef[];
  createdAt: IsoDateString;
}
