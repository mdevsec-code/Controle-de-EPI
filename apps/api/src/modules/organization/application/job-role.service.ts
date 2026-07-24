import { AppError } from "../../../shared/middlewares/error-handler.js";
import type { Paginated } from "../../../shared/pagination.js";
import type {
  CreateJobRoleData,
  JobRole,
  JobRoleRepository,
  UpdateJobRoleData,
} from "../domain/job-role-repository.js";

export class JobRoleService {
  constructor(private readonly jobRoleRepository: JobRoleRepository) {}

  async create(data: CreateJobRoleData): Promise<JobRole> {
    const existing = await this.jobRoleRepository.findByName(data.name);
    if (existing) {
      throw new AppError("Ja existe um cargo com este nome", 409);
    }
    return this.jobRoleRepository.create(data);
  }

  async update(id: string, data: UpdateJobRoleData): Promise<JobRole> {
    await this.getOrThrow(id);
    if (data.name) {
      const existing = await this.jobRoleRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new AppError("Ja existe um cargo com este nome", 409);
      }
    }
    return this.jobRoleRepository.update(id, data);
  }

  async getOrThrow(id: string): Promise<JobRole> {
    const jobRole = await this.jobRoleRepository.findById(id);
    if (!jobRole) {
      throw new AppError("Cargo nao encontrado", 404);
    }
    return jobRole;
  }

  async list(page: number, pageSize: number): Promise<Paginated<JobRole>> {
    const { items, total } = await this.jobRoleRepository.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }
}
