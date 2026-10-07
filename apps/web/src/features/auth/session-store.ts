import type { SessionResponse, SessionUser } from "@epi-manager/contracts";
import { create } from "zustand";

type SessionStatus = "unknown" | "authenticated" | "anonymous";

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  /** Access token SO em memoria (nunca em localStorage): some ao recarregar, e o refresh (cookie httpOnly) restaura. */
  accessToken: string | null;
  /** Almoxarifado em que o usuario esta operando. */
  activeWarehouseId: string | null;
  setSession: (session: SessionResponse) => void;
  setUser: (user: SessionUser) => void;
  clear: () => void;
  setActiveWarehouse: (warehouseId: string) => void;
}

const WAREHOUSE_KEY = "engenova:almoxarifado";

function readSavedWarehouse(): string | null {
  try {
    return localStorage.getItem(WAREHOUSE_KEY);
  } catch {
    return null;
  }
}

function pickWarehouse(user: SessionUser, current: string | null): string | null {
  const ids = user.warehouses.map((w) => w.id);
  if (current && ids.includes(current)) return current;
  const saved = readSavedWarehouse();
  if (saved && ids.includes(saved)) return saved;
  return ids[0] ?? null;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: "unknown",
  user: null,
  accessToken: null,
  activeWarehouseId: null,

  setSession: (session) =>
    set({
      status: "authenticated",
      user: session.user,
      accessToken: session.accessToken,
      activeWarehouseId: pickWarehouse(session.user, get().activeWarehouseId),
    }),

  setUser: (user) => set({ user, activeWarehouseId: pickWarehouse(user, get().activeWarehouseId) }),

  clear: () => set({ status: "anonymous", user: null, accessToken: null }),

  setActiveWarehouse: (warehouseId) => {
    try {
      localStorage.setItem(WAREHOUSE_KEY, warehouseId);
    } catch {
      // armazenamento indisponivel (modo privado): a escolha vale so nesta sessao
    }
    set({ activeWarehouseId: warehouseId });
  },
}));
