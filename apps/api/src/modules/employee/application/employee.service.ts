import { AppError } from "../../../shared/middlewares/error-handler.js";
import type { Paginated } from "../../../shared/pagination.js";
import type { BusinessUnitRepository } from "../../organization/domain/business-unit-repository.js";
import type { CompanyRepository } from "../../organization/domain/company-repository.js";
import type { DepartmentRepository } from "../../organization/domain/department-repository.js";
import type { JobRoleRepository } from "../../organization/domain/job-role-repository.js";
import type {
  CreateEmployeeData,
  Employee,
  EmployeeRepository,
  EmployeeStatus,
  UpdateEmployeeData,
} from "../domain/employee-repository.js";

interface ReferenceCheckInput {
  companyId: string;
  businessUnitId: string;
  departmentId: string;
  jobRoleId: string;
  supervisorId?: string;
}

export class EmployeeService {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly businessUnitRepository: BusinessUnitRepository,
    private readonly departmentRepository: DepartmentRepository,
    private readonly jobRoleRepository: JobRoleRepository,
  ) {}

  async create(data: CreateEmployeeData): Promise<Employee> {
    await this.validateReferences(data);

    const existingCpf = await this.employeeRepository.findByCpf(data.cpf);
    if (existingCpf) {
      throw new AppError("Ja existe um colaborador cadastrado com este CPF", 409);
    }

    const existingRegistration = await this.employeeRepository.findByBusinessUnitAndRegistration(
      data.businessUnitId,
      data.registration,
    );
    if (existingRegistration) {
      throw new AppError("Ja existe um colaborador com esta matricula nesta unidade", 409);
    }

    return this.employeeRepository.create(data);
  }

  async update(id: string, data: UpdateEmployeeData): Promise<Employee> {
    const employee = await this.getOrThrow(id);

    if (data.departmentId || data.jobRoleId || data.supervisorId) {
      await this.validateReferences({
        companyId: employee.companyId,
        businessUnitId: employee.businessUnitId,
        departmentId: data.departmentId ?? employee.departmentId,
        jobRoleId: data.jobRoleId ?? employee.jobRoleId,
        supervisorId: data.supervisorId,
      });
    }

    return this.employeeRepository.update(id, data);
  }

  async block(id: string): Promise<Employee> {
    await this.getOrThrow(id);
    return this.employeeRepository.updateStatus(id, "BLOQUEADO");
  }

  async unblock(id: string): Promise<Employee> {
    await this.getOrThrow(id);
    return this.employeeRepository.updateStatus(id, "ATIVO");
  }

  async terminate(id: string, terminationDate: Date): Promise<Employee> {
    await this.getOrThrow(id);
    return this.employeeRepository.updateStatus(id, "DESLIGADO", terminationDate);
  }

  async getOrThrow(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new AppError("Colaborador nao encontrado", 404);
    }
    return employee;
  }

  async list(
    filters: { businessUnitId?: string; departmentId?: string; status?: EmployeeStatus },
    page: number,
    pageSize: number,
  ): Promise<Paginated<Employee>> {
    const { items, total } = await this.employeeRepository.list({
      ...filters,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  private async validateReferences(data: ReferenceCheckInput): Promise<void> {
    const company = await this.companyRepository.findById(data.companyId);
    if (!company) {
      throw new AppError("Empresa informada nao existe", 404);
    }

    const unit = await this.businessUnitRepository.findById(data.businessUnitId);
    if (!unit || unit.companyId !== data.companyId) {
      throw new AppError("Unidade informada nao existe ou nao pertence a empresa informada", 404);
    }

    const department = await this.departmentRepository.findById(data.departmentId);
    if (!department || department.businessUnitId !== data.businessUnitId) {
      throw new AppError("Setor informado nao existe ou nao pertence a unidade informada", 404);
    }

    const jobRole = await this.jobRoleRepository.findById(data.jobRoleId);
    if (!jobRole) {
      throw new AppError("Cargo informado nao existe", 404);
    }

    if (data.supervisorId) {
      const supervisor = await this.employeeRepository.findById(data.supervisorId);
      if (!supervisor) {
        throw new AppError("Supervisor informado nao existe", 404);
      }
    }
  }
}
