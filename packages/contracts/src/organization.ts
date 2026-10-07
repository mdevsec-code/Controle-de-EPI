import { z } from "zod";
import {
  idSchema,
  optionalText,
  pageQuerySchema,
  requiredText,
  type IsoDateString,
} from "./common.js";

// --- Empresas ----------------------------------------------------------------

export const createCompanyRequestSchema = z.object({
  name: requiredText(2, 160),
  tradeName: optionalText(160),
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve conter 14 digitos numericos"),
  responsibleName: optionalText(120),
  responsibleEmail: z.email().optional(),
});
export type CreateCompanyRequest = z.input<typeof createCompanyRequestSchema>;

export const updateCompanyRequestSchema = createCompanyRequestSchema.omit({ cnpj: true }).partial();
export type UpdateCompanyRequest = z.input<typeof updateCompanyRequestSchema>;

export interface CompanyDto {
  id: string;
  name: string;
  tradeName: string | null;
  cnpj: string;
  responsibleName: string | null;
  responsibleEmail: string | null;
  createdAt: IsoDateString;
}

// --- Unidades ----------------------------------------------------------------

export const createBusinessUnitRequestSchema = z.object({
  companyId: idSchema,
  name: requiredText(2, 120),
  code: requiredText(1, 20),
  street: optionalText(160),
  number: optionalText(20),
  city: optionalText(120),
  state: z.string().length(2).toUpperCase().optional(),
  zipCode: optionalText(10),
});
export type CreateBusinessUnitRequest = z.input<typeof createBusinessUnitRequestSchema>;

export const updateBusinessUnitRequestSchema = createBusinessUnitRequestSchema
  .omit({ companyId: true, code: true })
  .partial();
export type UpdateBusinessUnitRequest = z.input<typeof updateBusinessUnitRequestSchema>;

export const listBusinessUnitsQuerySchema = pageQuerySchema.extend({
  companyId: idSchema.optional(),
});

export interface BusinessUnitDto {
  id: string;
  companyId: string;
  name: string;
  code: string;
  street: string | null;
  number: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  createdAt: IsoDateString;
}

// --- Setores -----------------------------------------------------------------

export const createDepartmentRequestSchema = z.object({
  businessUnitId: idSchema,
  name: requiredText(2, 120),
  code: requiredText(1, 20),
  parentId: idSchema.optional(),
});
export type CreateDepartmentRequest = z.input<typeof createDepartmentRequestSchema>;

export const updateDepartmentRequestSchema = z
  .object({ name: requiredText(2, 120), parentId: idSchema.nullable() })
  .partial();
export type UpdateDepartmentRequest = z.input<typeof updateDepartmentRequestSchema>;

export const listDepartmentsQuerySchema = pageQuerySchema.extend({
  businessUnitId: idSchema.optional(),
});

export interface DepartmentDto {
  id: string;
  businessUnitId: string;
  name: string;
  code: string;
  parentId: string | null;
  createdAt: IsoDateString;
}

// --- Cargos ------------------------------------------------------------------

export const createJobRoleRequestSchema = z.object({
  name: requiredText(2, 120),
  description: optionalText(500),
});
export type CreateJobRoleRequest = z.input<typeof createJobRoleRequestSchema>;

export const updateJobRoleRequestSchema = createJobRoleRequestSchema.partial();
export type UpdateJobRoleRequest = z.input<typeof updateJobRoleRequestSchema>;

export interface JobRoleDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: IsoDateString;
}

// --- Almoxarifados -----------------------------------------------------------

export const createWarehouseRequestSchema = z.object({
  businessUnitId: idSchema,
  name: requiredText(2, 120),
  code: requiredText(1, 20),
});
export type CreateWarehouseRequest = z.input<typeof createWarehouseRequestSchema>;

export const updateWarehouseRequestSchema = z.object({ name: requiredText(2, 120) }).partial();
export type UpdateWarehouseRequest = z.input<typeof updateWarehouseRequestSchema>;

export interface WarehouseDto {
  id: string;
  name: string;
  code: string;
  businessUnitId: string;
  businessUnitName: string;
}
