import {
  MAX_ITEM_QUANTITY,
  type CreateDeliveryRequest,
  type DeliveryDto,
  type DeliveryReason,
  type EmployeeSummaryDto,
  type StockItemDto,
} from "@epi-manager/contracts";
import { create } from "zustand";

/**
 * Rascunho da entrega entre as telas do fluxo (estado de UI, nao de servidor).
 * Regras ficam em funcoes puras abaixo; a API revalida tudo (saldo, CA, status, escopo).
 */

export interface DraftItem {
  stock: StockItemDto;
  quantity: number;
  notes: string;
}

export interface DeliveryDraft {
  idempotencyKey: string;
  warehouseId: string | null;
  employee: EmployeeSummaryDto | null;
  items: Record<string, DraftItem>;
  reason: DeliveryReason | null;
  reasonDetail: string;
  /** Preenchido apos a API confirmar o registro. */
  result: DeliveryDto | null;
}

/** Limite de quantidade: regra do legado (50) e o saldo exibido (a API confere o saldo real). */
export function maxQuantityFor(stock: StockItemDto): number {
  return Math.max(1, Math.min(MAX_ITEM_QUANTITY, stock.quantity));
}

export function clampQuantity(stock: StockItemDto, quantity: number): number {
  return Math.min(maxQuantityFor(stock), Math.max(1, Math.round(quantity)));
}

export type DraftStep = "colaborador" | "epis" | "motivo" | "assinatura";

/** Primeira etapa incompleta (para redirecionar quem entra no meio do fluxo). */
export function firstIncompleteStep(draft: DeliveryDraft): DraftStep | null {
  if (!draft.employee) return "colaborador";
  if (Object.keys(draft.items).length === 0) return "epis";
  if (!draft.reason || (draft.reason === "OUTRO" && !draft.reasonDetail.trim())) return "motivo";
  return null;
}

export function totalQuantity(draft: DeliveryDraft): number {
  return Object.values(draft.items).reduce((sum, item) => sum + item.quantity, 0);
}

export function toCreateRequest(draft: DeliveryDraft, signature: string): CreateDeliveryRequest {
  if (!draft.warehouseId || !draft.employee || !draft.reason) {
    throw new Error("Rascunho de entrega incompleto");
  }
  return {
    idempotencyKey: draft.idempotencyKey,
    employeeId: draft.employee.id,
    warehouseId: draft.warehouseId,
    reason: draft.reason,
    reasonDetail: draft.reason === "OUTRO" ? draft.reasonDetail.trim() : undefined,
    items: Object.values(draft.items).map((item) => ({
      stockItemId: item.stock.id,
      quantity: item.quantity,
      notes: item.notes.trim() || undefined,
    })),
    signature,
  };
}

function emptyDraft(warehouseId: string | null): DeliveryDraft {
  return {
    idempotencyKey: crypto.randomUUID(),
    warehouseId,
    employee: null,
    items: {},
    reason: null,
    reasonDetail: "",
    result: null,
  };
}

interface DraftActions {
  /** Comeca uma entrega nova (nova chave de idempotencia; descarta o rascunho anterior). */
  start: (warehouseId: string | null) => void;
  setEmployee: (employee: EmployeeSummaryDto) => void;
  toggleItem: (stock: StockItemDto) => void;
  setQuantity: (stockItemId: string, quantity: number) => void;
  setNotes: (stockItemId: string, notes: string) => void;
  setReason: (reason: DeliveryReason) => void;
  setReasonDetail: (detail: string) => void;
  complete: (result: DeliveryDto) => void;
}

export const useDeliveryDraft = create<DeliveryDraft & DraftActions>((set) => ({
  ...emptyDraft(null),

  start: (warehouseId) => set(emptyDraft(warehouseId)),

  // Trocar de colaborador mantem os EPIs escolhidos mas nunca um resultado anterior.
  setEmployee: (employee) => set({ employee, result: null }),

  toggleItem: (stock) =>
    set((state) => {
      const items = { ...state.items };
      if (items[stock.id]) delete items[stock.id];
      else items[stock.id] = { stock, quantity: 1, notes: "" };
      return { items };
    }),

  setQuantity: (stockItemId, quantity) =>
    set((state) => {
      const item = state.items[stockItemId];
      if (!item) return state;
      return {
        items: {
          ...state.items,
          [stockItemId]: { ...item, quantity: clampQuantity(item.stock, quantity) },
        },
      };
    }),

  setNotes: (stockItemId, notes) =>
    set((state) => {
      const item = state.items[stockItemId];
      if (!item) return state;
      return { items: { ...state.items, [stockItemId]: { ...item, notes } } };
    }),

  setReason: (reason) => set({ reason }),
  setReasonDetail: (reasonDetail) => set({ reasonDetail }),
  complete: (result) => set({ result }),
}));
