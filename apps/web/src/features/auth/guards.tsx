import type { UserRole } from "@epi-manager/contracts";
import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { EmptyState } from "@/components/ui/feedback";
import { useSessionStore } from "./session-store";

/** Exige sessao; troca de senha obrigatoria bloqueia o resto do app ate ser feita. */
export function RequireAuth() {
  const status = useSessionStore((s) => s.status);
  const mustChangePassword = useSessionStore((s) => s.user?.mustChangePassword);
  const location = useLocation();

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (mustChangePassword && location.pathname !== "/conta/senha") {
    return <Navigate to="/conta/senha" replace />;
  }
  return <Outlet />;
}

/**
 * Esconde rotas que o perfil nao usa. E apenas UX: a autorizacao real e feita pela API,
 * que recusa (403) qualquer chamada fora do perfil mesmo que a tela seja acessada.
 */
export function RequireRole({ roles, children }: { roles: UserRole[]; children?: ReactNode }) {
  const role = useSessionStore((s) => s.user?.role);
  if (!role || !roles.includes(role)) {
    return (
      <EmptyState
        title="Acesso restrito"
        description="Seu perfil não tem acesso a esta página. Se precisar, fale com o administrador."
      />
    );
  }
  return children ?? <Outlet />;
}
