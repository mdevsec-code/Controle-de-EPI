export interface BusinessUnit {
  id: string;
  companyId: string;
  name: string;
  code: string;
  street: string | null;
  number: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBusinessUnitData {
  companyId: string;
  name: string;
  code: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export type UpdateBusinessUnitData = Partial<Omit<CreateBusinessUnitData, "companyId" | "code">>;

export interface BusinessUnitRepository {
  create(data: CreateBusinessUnitData): Promise<BusinessUnit>;
  update(id: string, data: UpdateBusinessUnitData): Promise<BusinessUnit>;
  findById(id: string): Promise<BusinessUnit | null>;
  findByCompanyAndCode(companyId: string, code: string): Promise<BusinessUnit | null>;
  list(params: {
    companyId?: string;
    skip: number;
    take: number;
  }): Promise<{ items: BusinessUnit[]; total: number }>;
}
