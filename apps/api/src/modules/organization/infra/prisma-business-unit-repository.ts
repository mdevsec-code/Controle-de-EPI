import { prisma } from "@epi-manager/database";
import type {
  BusinessUnit,
  BusinessUnitRepository,
  CreateBusinessUnitData,
  UpdateBusinessUnitData,
} from "../domain/business-unit-repository.js";

export class PrismaBusinessUnitRepository implements BusinessUnitRepository {
  create(data: CreateBusinessUnitData): Promise<BusinessUnit> {
    return prisma.businessUnit.create({ data });
  }

  update(id: string, data: UpdateBusinessUnitData): Promise<BusinessUnit> {
    return prisma.businessUnit.update({ where: { id }, data });
  }

  findById(id: string): Promise<BusinessUnit | null> {
    return prisma.businessUnit.findUnique({ where: { id } });
  }

  findByCompanyAndCode(companyId: string, code: string): Promise<BusinessUnit | null> {
    return prisma.businessUnit.findUnique({ where: { companyId_code: { companyId, code } } });
  }

  async list({ companyId, skip, take }: { companyId?: string; skip: number; take: number }) {
    const where = companyId ? { companyId } : {};
    const [items, total] = await Promise.all([
      prisma.businessUnit.findMany({ where, skip, take, orderBy: { name: "asc" } }),
      prisma.businessUnit.count({ where }),
    ]);
    return { items, total };
  }
}
