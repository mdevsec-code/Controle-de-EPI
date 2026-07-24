import { AppError } from "../../../shared/middlewares/error-handler.js";
import type { CreateEpiCaData, EpiCA, EpiCaRepository } from "../domain/epi-ca-repository.js";
import type { EpiItemRepository } from "../domain/epi-item-repository.js";

export class EpiCaService {
  constructor(
    private readonly epiCaRepository: EpiCaRepository,
    private readonly epiItemRepository: EpiItemRepository,
  ) {}

  async register(data: CreateEpiCaData): Promise<EpiCA> {
    const epiItem = await this.epiItemRepository.findById(data.epiItemId);
    if (!epiItem) {
      throw new AppError("EPI informado nao existe", 404);
    }
    if (data.expiresAt <= data.issuedAt) {
      throw new AppError("Data de validade deve ser posterior a data de emissao", 422);
    }
    return this.epiCaRepository.create(data);
  }

  async history(epiItemId: string): Promise<EpiCA[]> {
    return this.epiCaRepository.listByEpiItem(epiItemId);
  }
}
