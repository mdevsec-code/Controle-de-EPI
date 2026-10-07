import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "@/features/auth/session-store";
import { firstIncompleteStep, useDeliveryDraft, type DraftStep } from "../draft";

const ORDER: DraftStep[] = ["colaborador", "epis", "motivo", "assinatura"];
const PATH: Record<DraftStep, string> = {
  colaborador: "/entregas/nova",
  epis: "/entregas/nova/epis",
  motivo: "/entregas/nova/motivo",
  assinatura: "/entregas/nova/assinatura",
};

/** Inicia uma entrega nova (usado por todos os pontos de entrada: menu, dashboard, "Nova entrega"). */
export function useStartDelivery() {
  const navigate = useNavigate();
  const start = useDeliveryDraft((s) => s.start);
  return () => {
    start(useSessionStore.getState().activeWarehouseId);
    navigate("/entregas/nova");
  };
}

/**
 * Quem abre uma etapa sem ter cumprido as anteriores (recarregou a pagina, link direto)
 * volta para a primeira etapa pendente.
 */
export function useRequireDraftStep(step: DraftStep) {
  const navigate = useNavigate();
  const draft = useDeliveryDraft();
  const pending = firstIncompleteStep(draft);
  const blocked = pending !== null && ORDER.indexOf(pending) < ORDER.indexOf(step);

  useEffect(() => {
    if (blocked && pending) navigate(PATH[pending], { replace: true });
  }, [blocked, pending, navigate]);

  return { draft, blocked };
}
