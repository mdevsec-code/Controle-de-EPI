export interface JobRole {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJobRoleData {
  name: string;
  description?: string;
}

export type UpdateJobRoleData = Partial<CreateJobRoleData>;

export interface JobRoleRepository {
  create(data: CreateJobRoleData): Promise<JobRole>;
  update(id: string, data: UpdateJobRoleData): Promise<JobRole>;
  findById(id: string): Promise<JobRole | null>;
  findByName(name: string): Promise<JobRole | null>;
  list(params: { skip: number; take: number }): Promise<{ items: JobRole[]; total: number }>;
}
