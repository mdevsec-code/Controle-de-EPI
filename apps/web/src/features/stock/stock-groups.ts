import type { StockItemDto } from "@epi-manager/contracts";
import { sizeLabel } from "@/lib/labels";

/**
 * Um "equipamento" na tela de estoque: todos os itens (modelo x tamanho x lote) com o mesmo
 * nome de EPI. A API continua devolvendo um item por variacao; o agrupamento e so de exibicao.
 */
export interface StockGroup {
  key: string;
  epiName: string;
  categoryName: string;
  items: StockItemDto[];
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

/** Agrupa mantendo a ordem da API (alfabetica por EPI). */
export function groupStock(items: StockItemDto[]): StockGroup[] {
  const groups = new Map<string, StockGroup>();
  for (const item of items) {
    const key = normalize(item.epiName);
    const group = groups.get(key);
    if (group) group.items.push(item);
    else
      groups.set(key, {
        key,
        epiName: item.epiName,
        categoryName: item.categoryName,
        items: [item],
      });
  }
  return [...groups.values()];
}

/** Modelo para filtro/rotulo; "" = sem modelo informado. */
export const modelOf = (item: StockItemDto) => item.model?.trim() ?? "";

const LETTER_SIZES = ["PP", "P", "M", "G", "GG", "XG", "XGG", "EG", "EGG"];

/** Ordena tamanhos de forma natural: numeros em ordem crescente e PP < P < M < G < GG... */
export function compareSizes(a: string, b: string): number {
  const ia = LETTER_SIZES.indexOf(a);
  const ib = LETTER_SIZES.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  return a.localeCompare(b, "pt-BR", { numeric: true });
}

const distinct = (values: string[]) => [...new Set(values)];

export const modelsOf = (items: StockItemDto[]) =>
  distinct(items.map(modelOf)).sort((a, b) => a.localeCompare(b, "pt-BR"));

export const sizesOf = (items: StockItemDto[]) =>
  distinct(items.map((i) => i.size)).sort(compareSizes);

export const locationsOf = (items: StockItemDto[]) =>
  distinct(items.map((i) => i.location).filter(Boolean)).sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true }),
  );

/** null = todos. */
export interface VariantFilter {
  model: string | null;
  size: string | null;
}

export function filterVariants(items: StockItemDto[], filter: VariantFilter) {
  return items.filter(
    (i) =>
      (filter.model === null || modelOf(i) === filter.model) &&
      (filter.size === null || i.size === filter.size),
  );
}

export const isLow = (item: StockItemDto) => item.quantity < item.minQuantity;

/** Rotulo curto da variacao: "Tam. 38 · Lote 12", "Modelo X · Tam. G" ou "Tamanho único". */
export function variantLabel(item: StockItemDto, withModel = false) {
  const parts = [
    withModel ? modelOf(item) || "Sem modelo" : null,
    sizeLabel(item.size),
    item.batchNumber ? `Lote ${item.batchNumber}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Tamanho único";
}

/** Locais: rotulo usado para "sem local" no filtro e nos agrupamentos. */
export const NO_LOCATION = "Local não definido";
