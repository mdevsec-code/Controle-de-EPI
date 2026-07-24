import { describe, expect, it, vi } from "vitest";
import type { Company, CompanyRepository } from "../domain/company-repository.js";
import { CompanyService } from "./company.service.js";

const existingCompany: Company = {
  id: "company-1",
  name: "EngeNova Industria S.A.",
  tradeName: "EngeNova",
  cnpj: "12345678000199",
  responsibleName: null,
  responsibleEmail: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

function buildRepository(overrides: Partial<CompanyRepository> = {}): CompanyRepository {
  return {
    create: vi.fn().mockResolvedValue(existingCompany),
    update: vi.fn().mockResolvedValue(existingCompany),
    findById: vi.fn().mockResolvedValue(null),
    findByCnpj: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue({ items: [existingCompany], total: 1 }),
    ...overrides,
  };
}

describe("CompanyService", () => {
  it("cria uma empresa quando o CNPJ ainda nao esta cadastrado", async () => {
    const repository = buildRepository();
    const service = new CompanyService(repository);

    const result = await service.create({ name: "Nova Empresa", cnpj: "99999999000199" });

    expect(result).toEqual(existingCompany);
    expect(repository.create).toHaveBeenCalledWith({ name: "Nova Empresa", cnpj: "99999999000199" });
  });

  it("rejeita a criacao quando ja existe empresa com o mesmo CNPJ", async () => {
    const repository = buildRepository({ findByCnpj: vi.fn().mockResolvedValue(existingCompany) });
    const service = new CompanyService(repository);

    await expect(
      service.create({ name: "Duplicada", cnpj: existingCompany.cnpj }),
    ).rejects.toThrow("Ja existe uma empresa cadastrada com este CNPJ");
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("lanca erro 404 ao buscar empresa inexistente", async () => {
    const repository = buildRepository({ findById: vi.fn().mockResolvedValue(null) });
    const service = new CompanyService(repository);

    await expect(service.getOrThrow("id-invalido")).rejects.toThrow("Empresa nao encontrada");
  });

  it("calcula corretamente o skip da paginacao", async () => {
    const repository = buildRepository();
    const service = new CompanyService(repository);

    await service.list(3, 10);

    expect(repository.list).toHaveBeenCalledWith({ skip: 20, take: 10 });
  });
});
