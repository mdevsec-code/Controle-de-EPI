import type { StockItemDto } from "@epi-manager/contracts";
import { describe, expect, it } from "vitest";
import {
  compareSizes,
  filterVariants,
  groupStock,
  locationsOf,
  modelsOf,
  sizesOf,
  variantLabel,
} from "./stock-groups";

const item = (over: Partial<StockItemDto>): StockItemDto => ({
  id: "s",
  warehouseId: "w-1",
  warehouseName: "Almoxarifado Central",
  epiItemId: "epi-1",
  epiName: "Bota de Segurança",
  model: null,
  internalCode: "EPI-BOTA",
  categoryName: "Proteção dos Pés",
  size: "",
  batchNumber: "",
  location: "",
  quantity: 1,
  minQuantity: 0,
  caNumber: "60110",
  ...over,
});

describe("agrupamento do estoque", () => {
  const items = [
    item({ id: "b40", size: "40", model: "Bracol", location: "Corredor C" }),
    item({ id: "b38", size: "38", model: "Bracol", location: "Corredor C" }),
    item({ id: "m38", size: "38", model: "Marluvas", epiItemId: "epi-2" }),
    item({ id: "pff", epiName: "Máscara PFF2", location: "Corredor A" }),
    item({
      id: "b38b",
      epiName: "bota de segurança ",
      size: "38",
      model: "Bracol",
      batchNumber: "L2",
    }),
  ];

  it("junta todas as variacoes do mesmo equipamento num unico grupo", () => {
    const groups = groupStock(items);
    expect(groups.map((g) => g.items.map((i) => i.id))).toEqual([
      ["b40", "b38", "m38", "b38b"],
      ["pff"],
    ]);
  });

  it("lista modelos e tamanhos distintos, com tamanhos em ordem natural", () => {
    const [botas] = groupStock(items);
    expect(modelsOf(botas!.items)).toEqual(["Bracol", "Marluvas"]);
    expect(sizesOf(botas!.items)).toEqual(["38", "40"]);
    expect(["GG", "P", "M", "G", "PP"].sort(compareSizes)).toEqual(["PP", "P", "M", "G", "GG"]);
  });

  it("filtra por modelo e tamanho (null = todos)", () => {
    const [botas] = groupStock(items);
    const ids = (model: string | null, size: string | null) =>
      filterVariants(botas!.items, { model, size }).map((i) => i.id);
    expect(ids("Bracol", "38")).toEqual(["b38", "b38b"]);
    expect(ids(null, "38")).toEqual(["b38", "m38", "b38b"]);
    expect(ids("Marluvas", null)).toEqual(["m38"]);
  });

  it("descreve variacoes e locais", () => {
    expect(variantLabel(item({ size: "38", batchNumber: "L2" }))).toBe("Tam. 38 · Lote L2");
    expect(variantLabel(item({ model: "Bracol", size: "38" }), true)).toBe("Bracol · Tam. 38");
    expect(variantLabel(item({}))).toBe("Tamanho único");
    expect(locationsOf(items)).toEqual(["Corredor A", "Corredor C"]);
  });
});
