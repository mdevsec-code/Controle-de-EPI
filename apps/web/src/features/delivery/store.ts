import { create } from "zustand";
import type { EpiCatalogItem, FoundEmployee, SelectedEpiEntry } from "./types";

interface DeliveryFlowState {
  employee: FoundEmployee | null;
  selected: Record<string, SelectedEpiEntry>;
  reason: string | null;
  signatureDataUrl: string | null;
  setEmployee: (employee: FoundEmployee) => void;
  toggleEpi: (epi: EpiCatalogItem) => void;
  setQuantity: (epiId: string, quantity: number) => void;
  setNotes: (epiId: string, notes: string) => void;
  setReason: (reason: string) => void;
  setSignature: (dataUrl: string) => void;
  reset: () => void;
}

export const useDeliveryFlowStore = create<DeliveryFlowState>((set) => ({
  employee: null,
  selected: {},
  reason: null,
  signatureDataUrl: null,

  setEmployee: (employee) => set({ employee }),

  toggleEpi: (epi) =>
    set((state) => {
      const next = { ...state.selected };
      if (next[epi.id]) {
        delete next[epi.id];
      } else {
        next[epi.id] = { epi, quantity: 1, notes: "" };
      }
      return { selected: next };
    }),

  setQuantity: (epiId, quantity) =>
    set((state) => {
      const entry = state.selected[epiId];
      if (!entry) return state;
      return {
        selected: { ...state.selected, [epiId]: { ...entry, quantity: Math.max(1, quantity) } },
      };
    }),

  setNotes: (epiId, notes) =>
    set((state) => {
      const entry = state.selected[epiId];
      if (!entry) return state;
      return { selected: { ...state.selected, [epiId]: { ...entry, notes } } };
    }),

  setReason: (reason) => set({ reason }),
  setSignature: (dataUrl) => set({ signatureDataUrl: dataUrl }),
  reset: () => set({ employee: null, selected: {}, reason: null, signatureDataUrl: null }),
}));
