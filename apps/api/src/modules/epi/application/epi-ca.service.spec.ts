import { describe, expect, it, vi } from "vitest";
import type { EpiCaRepository } from "../domain/epi-ca-repository.js";
import type { EpiItem, EpiItemRepository } from "../domain/epi-item-repository.js";
import { EpiCaService } from "./epi-ca.service.js";

const existingEpiItem: EpiItem = {
  id: "epi-1",
  name: "Capacete de Seguranca",
  internalCode: "EPI-CAP-001",
  barcode: null,
  category: "Protecao da Cabeca",
  manufacturer: "3M",
  model: null,
  controlType: "PATRIMONIO",
  photoUrl: null,
  manualUrl: null,
  minQuantity: 10,
  maxQuantity: null,
  unitValue: null,
  usefulLifeDays: 1825,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

function buildDeps() {
  const epiCaRepository: EpiCaRepository = {
    create: vi.fn().mockImplementation((data) => Promise.resolve({ id: "ca-1", createdAt: new Date(), ...data })),
    listByEpiItem: vi.fn().mockResolvedValue([]),
  };
  const epiItemRepository: EpiItemRepository = {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn().mockResolvedValue(existingEpiItem),
    findByInternalCode: vi.fn(),
    list: vi.fn(),
  };
  return { epiCaRepository, epiItemRepository };
}

describe("EpiCaService", () => {
  it("registra um novo CA quando o EPI existe e as datas sao validas", async () => {
    const { epiCaRepository, epiItemRepository } = buildDeps();
    const service = new EpiCaService(epiCaRepository, epiItemRepository);

    const result = await service.register({
      epiItemId: "epi-1",
      number: "31469",
      issuedAt: new Date("2026-01-01"),
      expiresAt: new Date("2031-01-01"),
    });

    expect(result.number).toBe("31469");
    expect(epiCaRepository.create).toHaveBeenCalled();
  });

  it("rejeita quando o EPI informado nao existe", async () => {
    const { epiCaRepository, epiItemRepository } = buildDeps();
    epiItemRepository.findById = vi.fn().mockResolvedValue(null);
    const service = new EpiCaService(epiCaRepository, epiItemRepository);

    await expect(
      service.register({
        epiItemId: "inexistente",
        number: "1",
        issuedAt: new Date("2026-01-01"),
        expiresAt: new Date("2031-01-01"),
      }),
    ).rejects.toThrow("EPI informado nao existe");
  });

  it("rejeita quando a data de validade nao e posterior a de emissao", async () => {
    const { epiCaRepository, epiItemRepository } = buildDeps();
    const service = new EpiCaService(epiCaRepository, epiItemRepository);

    await expect(
      service.register({
        epiItemId: "epi-1",
        number: "31469",
        issuedAt: new Date("2026-01-01"),
        expiresAt: new Date("2025-01-01"),
      }),
    ).rejects.toThrow("Data de validade deve ser posterior a data de emissao");
    expect(epiCaRepository.create).not.toHaveBeenCalled();
  });
});
