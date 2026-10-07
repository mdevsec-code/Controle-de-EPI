import { z } from "zod";
import {
  idSchema,
  optionalText,
  pageQuerySchema,
  requiredText,
  type IsoDateString,
} from "./common.js";
import { EMPLOYEE_STATUSES, type EmployeeStatus } from "./enums.js";
import { isValidCpf } from "./rules.js";

const cpfSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine(isValidCpf, "CPF invalido");

export const createEmployeeRequestSchema = z.object({
  registration: requiredText(1, 20),
  cpf: cpfSchema,
  name: requiredText(2, 160),
  email: z.email().optional(),
  phone: optionalText(20),
  photoUrl: z.url().optional(),
  admissionDate: z.coerce.date().optional(),
  costCenter: optionalText(80),
  businessUnitId: idSchema,
  departmentId: idSchema,
  jobRoleId: idSchema,
  supervisorId: idSchema.optional(),
});
export type CreateEmployeeRequest = z.input<typeof createEmployeeRequestSchema>;

export const updateEmployeeRequestSchema = createEmployeeRequestSchema
  .omit({ registration: true, cpf: true, businessUnitId: true, supervisorId: true })
  .extend({ supervisorId: idSchema.nullable() })
  .partial();
export type UpdateEmployeeRequest = z.input<typeof updateEmployeeRequestSchema>;

export const changeEmployeeStatusRequestSchema = z
  .object({
    status: z.enum(EMPLOYEE_STATUSES),
    terminationDate: z.coerce.date().optional(),
  })
  .refine((data) => data.status !== "DESLIGADO" || data.terminationDate, {
    message: "Informe a data de desligamento",
    path: ["terminationDate"],
  });
export type ChangeEmployeeStatusRequest = z.input<typeof changeEmployeeStatusRequestSchema>;

export const listEmployeesQuerySchema = pageQuerySchema.extend({
  /** Busca por nome (parcial, sem diferenciar maiusculas) ou matricula (exata/prefixo). */
  q: z.string().trim().max(100).optional(),
  businessUnitId: idSchema.optional(),
  departmentId: idSchema.optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
});
/** Parametros enviados pelo cliente (valores ja tipados; o cliente HTTP serializa). */
export type ListEmployeesQuery = Partial<z.output<typeof listEmployeesQuerySchema>>;

export const badgeCodeParamSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{16,64}$/, "Codigo de cracha invalido"),
});

/** Visao minima usada no fluxo de entrega (sem dados pessoais sensiveis). */
export interface EmployeeSummaryDto {
  id: string;
  name: string;
  registration: string;
  status: EmployeeStatus;
  photoUrl: string | null;
  jobRoleName: string;
  companyName: string;
  businessUnitName: string;
  departmentName: string;
  costCenter: string | null;
}

export interface EmployeeDto extends EmployeeSummaryDto {
  /** Completo para ADMIN; mascarado ("***.456.789-**") para ALMOXARIFADO. */
  cpf: string;
  email: string | null;
  phone: string | null;
  admissionDate: IsoDateString | null;
  terminationDate: IsoDateString | null;
  businessUnitId: string;
  departmentId: string;
  jobRoleId: string;
  supervisorId: string | null;
  /** Conteudo do QR do cracha. Somente ADMIN recebe. */
  badgeCode: string | null;
  createdAt: IsoDateString;
}

export interface BadgeCodeResponse {
  badgeCode: string;
}
