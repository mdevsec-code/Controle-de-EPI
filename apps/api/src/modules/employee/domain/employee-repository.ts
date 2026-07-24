export type EmployeeStatus = "ATIVO" | "INATIVO" | "BLOQUEADO" | "DESLIGADO";

export interface Employee {
  id: string;
  registration: string;
  cpf: string;
  name: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  status: EmployeeStatus;
  admissionDate: Date | null;
  terminationDate: Date | null;
  costCenter: string | null;
  companyId: string;
  businessUnitId: string;
  departmentId: string;
  jobRoleId: string;
  supervisorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeData {
  registration: string;
  cpf: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  admissionDate?: Date;
  costCenter?: string;
  companyId: string;
  businessUnitId: string;
  departmentId: string;
  jobRoleId: string;
  supervisorId?: string;
}

export type UpdateEmployeeData = Partial<
  Omit<CreateEmployeeData, "registration" | "companyId" | "businessUnitId" | "cpf">
>;

export interface EmployeeRepository {
  create(data: CreateEmployeeData): Promise<Employee>;
  update(id: string, data: UpdateEmployeeData): Promise<Employee>;
  updateStatus(id: string, status: EmployeeStatus, terminationDate?: Date): Promise<Employee>;
  findById(id: string): Promise<Employee | null>;
  findByCpf(cpf: string): Promise<Employee | null>;
  findByBusinessUnitAndRegistration(
    businessUnitId: string,
    registration: string,
  ): Promise<Employee | null>;
  list(params: {
    businessUnitId?: string;
    departmentId?: string;
    status?: EmployeeStatus;
    skip: number;
    take: number;
  }): Promise<{ items: Employee[]; total: number }>;
}
