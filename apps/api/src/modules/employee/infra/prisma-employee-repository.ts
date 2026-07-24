import { prisma } from "@epi-manager/database";
import type {
  CreateEmployeeData,
  Employee,
  EmployeeRepository,
  EmployeeStatus,
  UpdateEmployeeData,
} from "../domain/employee-repository.js";

export class PrismaEmployeeRepository implements EmployeeRepository {
  create(data: CreateEmployeeData): Promise<Employee> {
    return prisma.employee.create({ data });
  }

  update(id: string, data: UpdateEmployeeData): Promise<Employee> {
    return prisma.employee.update({ where: { id }, data });
  }

  updateStatus(id: string, status: EmployeeStatus, terminationDate?: Date): Promise<Employee> {
    return prisma.employee.update({
      where: { id },
      data: { status, ...(terminationDate ? { terminationDate } : {}) },
    });
  }

  findById(id: string): Promise<Employee | null> {
    return prisma.employee.findFirst({ where: { id, deletedAt: null } });
  }

  findByCpf(cpf: string): Promise<Employee | null> {
    return prisma.employee.findFirst({ where: { cpf, deletedAt: null } });
  }

  findByBusinessUnitAndRegistration(
    businessUnitId: string,
    registration: string,
  ): Promise<Employee | null> {
    return prisma.employee.findFirst({ where: { businessUnitId, registration, deletedAt: null } });
  }

  async list({
    businessUnitId,
    departmentId,
    status,
    skip,
    take,
  }: {
    businessUnitId?: string;
    departmentId?: string;
    status?: EmployeeStatus;
    skip: number;
    take: number;
  }) {
    const where = {
      deletedAt: null,
      ...(businessUnitId ? { businessUnitId } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(status ? { status } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.employee.findMany({ where, skip, take, orderBy: { name: "asc" } }),
      prisma.employee.count({ where }),
    ]);
    return { items, total };
  }
}
