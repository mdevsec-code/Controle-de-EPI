import { prisma } from "@epi-manager/database";
import type { CreateEpiCaData, EpiCA, EpiCaRepository } from "../domain/epi-ca-repository.js";

export class PrismaEpiCaRepository implements EpiCaRepository {
  create(data: CreateEpiCaData): Promise<EpiCA> {
    return prisma.epiCA.create({ data });
  }

  listByEpiItem(epiItemId: string): Promise<EpiCA[]> {
    return prisma.epiCA.findMany({ where: { epiItemId }, orderBy: { issuedAt: "desc" } });
  }
}
