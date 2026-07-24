import { prisma } from "@epi-manager/database";
import type { EpiItem as PrismaEpiItemRow } from "@epi-manager/database";
import type {
  CreateEpiItemData,
  EpiItem,
  EpiItemRepository,
  UpdateEpiItemData,
} from "../domain/epi-item-repository.js";

function toDomain(row: PrismaEpiItemRow): EpiItem {
  return {
    id: row.id,
    name: row.name,
    internalCode: row.internalCode,
    barcode: row.barcode,
    category: row.category,
    manufacturer: row.manufacturer,
    model: row.model,
    controlType: row.controlType,
    photoUrl: row.photoUrl,
    manualUrl: row.manualUrl,
    minQuantity: row.minQuantity,
    maxQuantity: row.maxQuantity,
    unitValue: row.unitValue === null ? null : Number(row.unitValue),
    usefulLifeDays: row.usefulLifeDays,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaEpiItemRepository implements EpiItemRepository {
  async create(data: CreateEpiItemData): Promise<EpiItem> {
    return toDomain(await prisma.epiItem.create({ data }));
  }

  async update(id: string, data: UpdateEpiItemData): Promise<EpiItem> {
    return toDomain(await prisma.epiItem.update({ where: { id }, data }));
  }

  async findById(id: string): Promise<EpiItem | null> {
    const row = await prisma.epiItem.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByInternalCode(internalCode: string): Promise<EpiItem | null> {
    const row = await prisma.epiItem.findUnique({ where: { internalCode } });
    return row ? toDomain(row) : null;
  }

  async list({ category, skip, take }: { category?: string; skip: number; take: number }) {
    const where = category ? { category } : {};
    const [rows, total] = await Promise.all([
      prisma.epiItem.findMany({ where, skip, take, orderBy: { name: "asc" } }),
      prisma.epiItem.count({ where }),
    ]);
    return { items: rows.map(toDomain), total };
  }
}
