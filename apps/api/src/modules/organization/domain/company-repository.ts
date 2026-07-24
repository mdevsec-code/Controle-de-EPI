export interface Company {
  id: string;
  name: string;
  tradeName: string | null;
  cnpj: string;
  responsibleName: string | null;
  responsibleEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyData {
  name: string;
  tradeName?: string;
  cnpj: string;
  responsibleName?: string;
  responsibleEmail?: string;
}

export type UpdateCompanyData = Partial<Omit<CreateCompanyData, "cnpj">>;

export interface CompanyRepository {
  create(data: CreateCompanyData): Promise<Company>;
  update(id: string, data: UpdateCompanyData): Promise<Company>;
  findById(id: string): Promise<Company | null>;
  findByCnpj(cnpj: string): Promise<Company | null>;
  list(params: { skip: number; take: number }): Promise<{ items: Company[]; total: number }>;
}
