import { AppError } from "../../../shared/middlewares/error-handler.js";
import type { Paginated } from "../../../shared/pagination.js";
import type {
  BusinessUnit,
  BusinessUnitRepository,
  CreateBusinessUnitData,
  UpdateBusinessUnitData,
} from "../domain/business-unit-repository.js";
import type { CompanyRepository } from "../domain/company-repository.js";

export class BusinessUnitService {
  constructor(
    private readonly businessUnitRepository: BusinessUnitRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async create(data: CreateBusinessUnitData): Promise<BusinessUnit> {
    const company = await this.companyRepository.findById(data.companyId);
    if (!company) {
      throw new AppError("Empresa informada nao existe", 404);
    }

    const existing = await this.businessUnitRepository.findByCompanyAndCode(
      data.companyId,
      data.code,
    );
    if (existing) {
      throw new AppError("Ja existe uma unidade com este codigo para a empresa informada", 409);
    }

    return this.businessUnitRepository.create(data);
  }

  async update(id: string, data: UpdateBusinessUnitData): Promise<BusinessUnit> {
    await this.getOrThrow(id);
    return this.businessUnitRepository.update(id, data);
  }

  async getOrThrow(id: string): Promise<BusinessUnit> {
    const unit = await this.businessUnitRepository.findById(id);
    if (!unit) {
      throw new AppError("Unidade nao encontrada", 404);
    }
    return unit;
  }

  async list(companyId: string | undefined, page: number, pageSize: number): Promise<Paginated<BusinessUnit>> {
    const { items, total } = await this.businessUnitRepository.list({
      companyId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }
}
