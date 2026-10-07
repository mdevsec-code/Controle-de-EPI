import { maskCpf, type EmployeeDto, type EmployeeSummaryDto } from "@epi-manager/contracts";
import type { Prisma } from "@epi-manager/database";
import { iso, isoOrNull } from "../../shared/format.js";
import type { AuthContext } from "../../shared/http/auth-context.js";

export const employeeInclude = {
  jobRole: { select: { name: true } },
  department: { select: { name: true } },
  businessUnit: { select: { name: true, company: { select: { tradeName: true, name: true } } } },
} satisfies Prisma.EmployeeInclude;

export type EmployeeRow = Prisma.EmployeeGetPayload<{ include: typeof employeeInclude }>;

export function toEmployeeSummary(e: EmployeeRow): EmployeeSummaryDto {
  return {
    id: e.id,
    name: e.name,
    registration: e.registration,
    status: e.status,
    photoUrl: e.photoUrl,
    jobRoleName: e.jobRole.name,
    companyName: e.businessUnit.company.tradeName ?? e.businessUnit.company.name,
    businessUnitName: e.businessUnit.name,
    departmentName: e.department.name,
    costCenter: e.costCenter,
  };
}

/** Dados pessoais completos (CPF, cracha) so para ADMIN; ALMOXARIFADO recebe CPF mascarado. */
export function toEmployeeDto(e: EmployeeRow, auth: AuthContext): EmployeeDto {
  const isAdmin = auth.role === "ADMIN";
  return {
    ...toEmployeeSummary(e),
    cpf: isAdmin ? e.cpf : maskCpf(e.cpf),
    email: e.email,
    phone: e.phone,
    admissionDate: isoOrNull(e.admissionDate),
    terminationDate: isoOrNull(e.terminationDate),
    businessUnitId: e.businessUnitId,
    departmentId: e.departmentId,
    jobRoleId: e.jobRoleId,
    supervisorId: e.supervisorId,
    badgeCode: isAdmin ? e.badgeCode : null,
    createdAt: iso(e.createdAt),
  };
}
