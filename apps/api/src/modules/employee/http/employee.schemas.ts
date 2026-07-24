import { z } from "zod";

const cpfSchema = z.string().regex(/^\d{11}$/, "CPF deve conter 11 digitos numericos");

export const createEmployeeBodySchema = z.object({
  registration: z.string().min(1).max(20),
  cpf: cpfSchema,
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  photoUrl: z.string().url().optional(),
  admissionDate: z.coerce.date().optional(),
  costCenter: z.string().optional(),
  companyId: z.string().uuid(),
  businessUnitId: z.string().uuid(),
  departmentId: z.string().uuid(),
  jobRoleId: z.string().uuid(),
  supervisorId: z.string().uuid().optional(),
});

export const updateEmployeeBodySchema = createEmployeeBodySchema
  .omit({ registration: true, cpf: true, companyId: true, businessUnitId: true })
  .partial();

export const terminateEmployeeBodySchema = z.object({
  terminationDate: z.coerce.date(),
});

export const listEmployeeQuerySchema = z.object({
  businessUnitId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.enum(["ATIVO", "INATIVO", "BLOQUEADO", "DESLIGADO"]).optional(),
});
