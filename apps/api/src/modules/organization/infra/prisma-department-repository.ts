import { prisma } from "@epi-manager/database";
import type {
  CreateDepartmentData,
  Department,
  DepartmentRepository,
  UpdateDepartmentData,
} from "../domain/department-repository.js";

export class PrismaDepartmentRepository implements DepartmentRepository {
  create(data: CreateDepartmentData): Promise<Department> {
    return prisma.department.create({ data });
  }

  update(id: string, data: UpdateDepartmentData): Promise<Department> {
    return prisma.department.update({ where: { id }, data });
  }

  findById(id: string): Promise<Department | null> {
    return prisma.department.findUnique({ where: { id } });
  }

  findByUnitAndCode(businessUnitId: string, code: string): Promise<Department | null> {
    return prisma.department.findUnique({ where: { businessUnitId_code: { businessUnitId, code } } });
  }

  async list({
    businessUnitId,
    skip,
    take,
  }: {
    businessUnitId?: string;
    skip: number;
    take: number;
  }) {
    const where = businessUnitId ? { businessUnitId } : {};
    const [items, total] = await Promise.all([
      prisma.department.findMany({ where, skip, take, orderBy: { name: "asc" } }),
      prisma.department.count({ where }),
    ]);
    return { items, total };
  }
}
