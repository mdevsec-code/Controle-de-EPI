import { AppError } from "../../../shared/middlewares/error-handler.js";
import type { Paginated } from "../../../shared/pagination.js";
import type {
  Company,
  CompanyRepository,
  CreateCompanyData,
  UpdateCompanyData,
} from "../domain/company-repository.js";

export class CompanyService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async create(data: CreateCompanyData): Promise<Company> {
    const existing = await this.companyRepository.findByCnpj(data.cnpj);
    if (existing) {
      throw new AppError("Ja existe uma empresa cadastrada com este CNPJ", 409);
    }
    return this.companyRepository.create(data);
  }

  async update(id: string, data: UpdateCompanyData): Promise<Company> {
    await this.getOrThrow(id);
    return this.companyRepository.update(id, data);
  }

  async getOrThrow(id: string): Promise<Company> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new AppError("Empresa nao encontrada", 404);
    }
    return company;
  }

  async list(page: number, pageSize: number): Promise<Paginated<Company>> {
    const { items, total } = await this.companyRepository.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }
}
