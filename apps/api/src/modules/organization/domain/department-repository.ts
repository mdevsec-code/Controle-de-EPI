export interface Department {
  id: string;
  businessUnitId: string;
  name: string;
  code: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDepartmentData {
  businessUnitId: string;
  name: string;
  code: string;
  parentId?: string;
}

export type UpdateDepartmentData = Partial<Pick<CreateDepartmentData, "name" | "parentId">>;

export interface DepartmentRepository {
  create(data: CreateDepartmentData): Promise<Department>;
  update(id: string, data: UpdateDepartmentData): Promise<Department>;
  findById(id: string): Promise<Department | null>;
  findByUnitAndCode(businessUnitId: string, code: string): Promise<Department | null>;
  list(params: {
    businessUnitId?: string;
    skip: number;
    take: number;
  }): Promise<{ items: Department[]; total: number }>;
}
