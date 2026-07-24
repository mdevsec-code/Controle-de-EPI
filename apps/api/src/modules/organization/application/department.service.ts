import { AppError } from "../../../shared/middlewares/error-handler.js";
import type { Paginated } from "../../../shared/pagination.js";
import type { BusinessUnitRepository } from "../domain/business-unit-repository.js";
import type {
  CreateDepartmentData,
  Department,
  DepartmentRepository,
  UpdateDepartmentData,
} from "../domain/department-repository.js";

export class DepartmentService {
  constructor(
    private readonly departmentRepository: DepartmentRepository,
    private readonly businessUnitRepository: BusinessUnitRepository,
  ) {}

  async create(data: CreateDepartmentData): Promise<Department> {
    const unit = await this.businessUnitRepository.findById(data.businessUnitId);
    if (!unit) {
      throw new AppError("Unidade informada nao existe", 404);
    }

    if (data.parentId) {
      await this.validateParent(data.businessUnitId, data.parentId);
    }

    const existing = await this.departmentRepository.findByUnitAndCode(
      data.businessUnitId,
      data.code,
    );
    if (existing) {
      throw new AppError("Ja existe um setor com este codigo nesta unidade", 409);
    }

    return this.departmentRepository.create(data);
  }

  async update(id: string, data: UpdateDepartmentData): Promise<Department> {
    const department = await this.getOrThrow(id);

    if (data.parentId) {
      if (data.parentId === id) {
        throw new AppError("Um setor nao pode ser pai de si mesmo", 422);
      }
      await this.validateParent(department.businessUnitId, data.parentId);
    }

    return this.departmentRepository.update(id, data);
  }

  async getOrThrow(id: string): Promise<Department> {
    const department = await this.departmentRepository.findById(id);
    if (!department) {
      throw new AppError("Setor nao encontrado", 404);
    }
    return department;
  }

  async list(
    businessUnitId: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<Paginated<Department>> {
    const { items, total } = await this.departmentRepository.list({
      businessUnitId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  private async validateParent(businessUnitId: string, parentId: string): Promise<void> {
    const parent = await this.departmentRepository.findById(parentId);
    if (!parent) {
      throw new AppError("Setor pai informado nao existe", 404);
    }
    if (parent.businessUnitId !== businessUnitId) {
      throw new AppError("O setor pai deve pertencer a mesma unidade", 422);
    }
  }
}
