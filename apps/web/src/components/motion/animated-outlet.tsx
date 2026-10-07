import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Suspense, useState, type ReactElement } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { Spinner } from "@/components/ui/feedback";
import { EASE } from "@/lib/motion";

/** Mantem o conteudo da rota que esta saindo enquanto a animacao de saida roda. */
function Frozen({ outlet }: { outlet: ReactElement | null }) {
  const [frozen] = useState(outlet);
  return frozen;
}

/**
 * Outlet com transicao entre paginas. `direction` (1 avancar, -1 voltar) faz o fluxo de entrega
 * deslizar no sentido certo; sem direcao, a pagina sobe e assenta.
 */
export function AnimatedOutlet({
  direction = 0,
  className,
}: {
  direction?: number;
  className?: string;
}) {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <m.div
        key={location.pathname}
        custom={direction}
        className={className}
        // So opacidade/transform: filter deixaria um "containing block" que quebra position:fixed.
        variants={{
          // Fluxo de entrega: tela entra deslizando do lado do avanco (como no prototipo).
          enter: (dir: number) => ({ opacity: 0, x: dir * 28, y: dir === 0 ? 6 : 0 }),
          center: { opacity: 1, x: 0, y: 0, transitionEnd: { transform: "none" } },
          exit: (dir: number) => ({ opacity: 0, x: dir * -16, transition: { duration: 0.16 } }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.28, ease: EASE }}
      >
        {/* Suspense por pagina: o carregamento de uma rota lazy nao interrompe a transicao. */}
        <Suspense fallback={<Spinner />}>
          <Frozen outlet={outlet} />
        </Suspense>
      </m.div>
    </AnimatePresence>
  );
}
