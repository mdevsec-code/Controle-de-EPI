import { AppError } from "../../../shared/middlewares/error-handler.js";
import type { Paginated } from "../../../shared/pagination.js";
import type {
  CreateEpiItemData,
  EpiItem,
  EpiItemRepository,
  UpdateEpiItemData,
} from "../domain/epi-item-repository.js";

export class EpiItemService {
  constructor(private readonly epiItemRepository: EpiItemRepository) {}

  async create(data: CreateEpiItemData): Promise<EpiItem> {
    const existing = await this.epiItemRepository.findByInternalCode(data.internalCode);
    if (existing) {
      throw new AppError("Ja existe um EPI cadastrado com este codigo interno", 409);
    }
    return this.epiItemRepository.create(data);
  }

  async update(id: string, data: UpdateEpiItemData): Promise<EpiItem> {
    await this.getOrThrow(id);
    return this.epiItemRepository.update(id, data);
  }

  async getOrThrow(id: string): Promise<EpiItem> {
    const item = await this.epiItemRepository.findById(id);
    if (!item) {
      throw new AppError("EPI nao encontrado", 404);
    }
    return item;
  }

  async list(
    category: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<Paginated<EpiItem>> {
    const { items, total } = await this.epiItemRepository.list({
      category,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }
}
