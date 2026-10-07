import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";

/**
 * Infraestrutura de animacao (Motion).
 * - LazyMotion: as features (incl. layout/drag) carregam em chunk proprio, fora do bundle inicial.
 * - reducedMotion="user": quem pediu menos movimento no sistema recebe so as mudancas de opacidade.
 */
const loadFeatures = () => import("@/lib/motion-features").then((module) => module.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.45, ease: EASE }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
