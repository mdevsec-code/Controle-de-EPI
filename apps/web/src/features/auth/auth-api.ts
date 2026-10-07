import type {
  ChangePasswordRequest,
  LoginRequest,
  SessionResponse,
  UserRole,
} from "@epi-manager/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useSessionStore } from "./session-store";

export function useLogin() {
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: LoginRequest) =>
      api.post<SessionResponse>("/auth/login", input, { auth: false }),
    onSuccess: setSession,
  });
}

export function useChangePassword() {
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: ChangePasswordRequest) =>
      api.post<SessionResponse>("/auth/change-password", input),
    onSuccess: setSession,
  });
}

/** Encerra a sessao no servidor (revoga o refresh) e limpa todo dado em cache no cliente. */
export function useLogout() {
  const queryClient = useQueryClient();
  const clear = useSessionStore((s) => s.clear);
  const navigate = useNavigate();
  return async () => {
    try {
      await api.post("/auth/logout", undefined, { auth: false });
    } finally {
      clear();
      queryClient.clear();
      navigate("/login", { replace: true });
    }
  };
}

export function useCurrentUser() {
  const user = useSessionStore((s) => s.user);
  if (!user) throw new Error("useCurrentUser fora de rota autenticada");
  return user;
}

export function useHasRole(...roles: UserRole[]): boolean {
  const role = useSessionStore((s) => s.user?.role);
  return role !== undefined && roles.includes(role);
}

/** Almoxarifado ativo do usuario (null se nenhum vinculado). */
export function useActiveWarehouse() {
  const user = useSessionStore((s) => s.user);
  const activeId = useSessionStore((s) => s.activeWarehouseId);
  return user?.warehouses.find((w) => w.id === activeId) ?? null;
}
