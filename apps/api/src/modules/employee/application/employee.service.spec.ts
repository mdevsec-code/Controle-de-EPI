import { describe, expect, it, vi } from "vitest";
import type { BusinessUnit, BusinessUnitRepository } from "../../organization/domain/business-unit-repository.js";
import type { Company, CompanyRepository } from "../../organization/domain/company-repository.js";
import type { Department, DepartmentRepository } from "../../organization/domain/department-repository.js";
import type { JobRole, JobRoleRepository } from "../../organization/domain/job-role-repository.js";
import type { Employee, EmployeeRepository } from "../domain/employee-repository.js";
import { EmployeeService } from "./employee.service.js";

const company: Company = {
  id: "company-1",
  name: "EngeNova",
  tradeName: null,
  cnpj: "12345678000199",
  responsibleName: null,
  responsibleEmail: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const businessUnit: BusinessUnit = {
  id: "unit-1",
  companyId: "company-1",
  name: "Matriz",
  code: "MATRIZ",
  street: null,
  number: null,
  city: null,
  state: null,
  zipCode: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const department: Department = {
  id: "dept-1",
  businessUnitId: "unit-1",
  name: "Producao",
  code: "PROD",
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const jobRole: JobRole = {
  id: "role-1",
  name: "Operador",
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validInput = {
  registration: "0001",
  cpf: "11122233344",
  name: "Colaborador Teste",
  companyId: "company-1",
  businessUnitId: "unit-1",
  departmentId: "dept-1",
  jobRoleId: "role-1",
};

function buildDeps(overrides: { employee?: Partial<EmployeeRepository> } = {}) {
  const employeeRepository: EmployeeRepository = {
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({ id: "employee-1", status: "ATIVO", createdAt: new Date(), updatedAt: new Date(), ...data } as Employee),
    ),
    update: vi.fn(),
    updateStatus: vi.fn(),
    findById: vi.fn().mockResolvedValue(null),
    findByCpf: vi.fn().mockResolvedValue(null),
    findByBusinessUnitAndRegistration: vi.fn().mockResolvedValue(null),
    list: vi.fn(),
    ...overrides.employee,
  };

  const companyRepository: CompanyRepository = {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn().mockResolvedValue(company),
    findByCnpj: vi.fn(),
    list: vi.fn(),
  };

  const businessUnitRepository: BusinessUnitRepository = {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn().mockResolvedValue(businessUnit),
    findByCompanyAndCode: vi.fn(),
    list: vi.fn(),
  };

  const departmentRepository: DepartmentRepository = {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn().mockResolvedValue(department),
    findByUnitAndCode: vi.fn(),
    list: vi.fn(),
  };

  const jobRoleRepository: JobRoleRepository = {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn().mockResolvedValue(jobRole),
    findByName: vi.fn(),
    list: vi.fn(),
  };

  return {
    employeeRepository,
    companyRepository,
    businessUnitRepository,
    departmentRepository,
    jobRoleRepository,
  };
}

function buildService(deps: ReturnType<typeof buildDeps>) {
  return new EmployeeService(
    deps.employeeRepository,
    deps.companyRepository,
    deps.businessUnitRepository,
    deps.departmentRepository,
    deps.jobRoleRepository,
  );
}

describe("EmployeeService", () => {
  it("cria um colaborador quando todas as referencias sao validas", async () => {
    const deps = buildDeps();
    const service = buildService(deps);

    const result = await service.create(validInput);

    expect(result.registration).toBe("0001");
    expect(deps.employeeRepository.create).toHaveBeenCalledWith(validInput);
  });

  it("rejeita quando o setor informado nao pertence a unidade informada", async () => {
    const deps = buildDeps();
    deps.departmentRepository.findById = vi
      .fn()
      .mockResolvedValue({ ...department, businessUnitId: "outra-unidade" });
    const service = buildService(deps);

    await expect(service.create(validInput)).rejects.toThrow(
      "Setor informado nao existe ou nao pertence a unidade informada",
    );
  });

  it("rejeita quando ja existe colaborador com o mesmo CPF", async () => {
    const deps = buildDeps({
      employee: { findByCpf: vi.fn().mockResolvedValue({ id: "outro" } as Employee) },
    });
    const service = buildService(deps);

    await expect(service.create(validInput)).rejects.toThrow(
      "Ja existe um colaborador cadastrado com este CPF",
    );
  });

  it("rejeita quando ja existe colaborador com a mesma matricula na unidade", async () => {
    const deps = buildDeps({
      employee: {
        findByBusinessUnitAndRegistration: vi.fn().mockResolvedValue({ id: "outro" } as Employee),
      },
    });
    const service = buildService(deps);

    await expect(service.create(validInput)).rejects.toThrow(
      "Ja existe um colaborador com esta matricula nesta unidade",
    );
  });

  it("bloqueia um colaborador existente", async () => {
    const deps = buildDeps({
      employee: {
        findById: vi.fn().mockResolvedValue({ id: "employee-1", status: "ATIVO" } as Employee),
        updateStatus: vi.fn().mockResolvedValue({ id: "employee-1", status: "BLOQUEADO" } as Employee),
      },
    });
    const service = buildService(deps);

    const result = await service.block("employee-1");

    expect(result.status).toBe("BLOQUEADO");
    expect(deps.employeeRepository.updateStatus).toHaveBeenCalledWith("employee-1", "BLOQUEADO");
  });
});
