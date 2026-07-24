import { prisma } from "@epi-manager/database";
import type {
  Company,
  CompanyRepository,
  CreateCompanyData,
  UpdateCompanyData,
} from "../domain/company-repository.js";

export class PrismaCompanyRepository implements CompanyRepository {
  create(data: CreateCompanyData): Promise<Company> {
    return prisma.company.create({ data });
  }

  update(id: string, data: UpdateCompanyData): Promise<Company> {
    return prisma.company.update({ where: { id }, data });
  }

  findById(id: string): Promise<Company | null> {
    return prisma.company.findUnique({ where: { id } });
  }

  findByCnpj(cnpj: string): Promise<Company | null> {
    return prisma.company.findUnique({ where: { cnpj } });
  }

  async list({ skip, take }: { skip: number; take: number }) {
    const [items, total] = await Promise.all([
      prisma.company.findMany({ skip, take, orderBy: { name: "asc" } }),
      prisma.company.count(),
    ]);
    return { items, total };
  }
}
