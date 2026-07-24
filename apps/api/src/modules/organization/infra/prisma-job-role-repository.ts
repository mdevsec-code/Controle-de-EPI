import { prisma } from "@epi-manager/database";
import type {
  CreateJobRoleData,
  JobRole,
  JobRoleRepository,
  UpdateJobRoleData,
} from "../domain/job-role-repository.js";

export class PrismaJobRoleRepository implements JobRoleRepository {
  create(data: CreateJobRoleData): Promise<JobRole> {
    return prisma.jobRole.create({ data });
  }

  update(id: string, data: UpdateJobRoleData): Promise<JobRole> {
    return prisma.jobRole.update({ where: { id }, data });
  }

  findById(id: string): Promise<JobRole | null> {
    return prisma.jobRole.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<JobRole | null> {
    return prisma.jobRole.findUnique({ where: { name } });
  }

  async list({ skip, take }: { skip: number; take: number }) {
    const [items, total] = await Promise.all([
      prisma.jobRole.findMany({ skip, take, orderBy: { name: "asc" } }),
      prisma.jobRole.count(),
    ]);
    return { items, total };
  }
}
