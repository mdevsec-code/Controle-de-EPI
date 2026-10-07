import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { AnimatedOutlet } from "@/components/motion/animated-outlet";

/** Ordem das telas do fluxo de entrega: define se a transicao avanca ou volta. */
const FLOW_ORDER = [
  "/entregas/nova",
  "/entregas/nova/scanner",
  "/entregas/nova/colaborador",
  "/entregas/nova/epis",
  "/entregas/nova/quantidades",
  "/entregas/nova/motivo",
  "/entregas/nova/assinatura",
  "/entregas/nova/concluida",
];

/**
 * Telas de tela cheia (fluxo de entrega, comprovante): sem menu, com carregamento sob demanda e
 * transicao direcional (avancar desliza para a esquerda, voltar para a direita).
 */
export function FullScreenSuspense() {
  const { pathname } = useLocation();
  const index = FLOW_ORDER.indexOf(pathname);
  const previous = useRef(index);
  const direction = index < 0 || previous.current < 0 ? 0 : Math.sign(index - previous.current);

  useEffect(() => {
    previous.current = index;
  }, [index]);

  return <AnimatedOutlet direction={direction} />;
}
