import type { Transition, Variants } from "motion/react";

/**
 * Linguagem de movimento do prototipo legado: transicoes curtas (~0,3 s) com a curva
 * cubic-bezier(.32,.72,0,1), "pop" no check de sucesso e escala .98 no toque. Nada de desfoque
 * nem deslocamentos grandes: animacoes leves, que nao atrasam o trabalho no almoxarifado.
 */
export const EASE = [0.32, 0.72, 0, 1] as const;

export const SPRING_SNAPPY: Transition = { type: "spring", stiffness: 500, damping: 38 };
/** Mesmo efeito do @keyframes pop do legado (cresce, passa um pouco e assenta). */
export const SPRING_POP: Transition = { type: "spring", stiffness: 420, damping: 14 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

export function stagger(staggerChildren = 0.035, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren, delayChildren } },
  };
}
