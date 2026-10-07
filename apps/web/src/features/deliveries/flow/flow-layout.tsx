import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const STEPS = ["Colaborador", "EPIs", "Quantidade", "Motivo", "Assinatura"] as const;

interface FlowLayoutProps {
  title: string;
  /** Indice (0-4) da etapa atual, anunciado a leitores de tela. */
  step?: number;
  backTo?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Tela do fluxo de entrega no padrao do legado: seta de voltar, titulo centralizado,
 * conteudo e botao principal fixo no rodape sobre um degrade do fundo.
 */
export function FlowLayout({ title, step, backTo, children, footer }: FlowLayoutProps) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-neutral-50 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-xl items-center px-3">
          <button
            type="button"
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-900/5"
          >
            <ArrowLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="flex-1 truncate pr-10 text-center text-base font-bold text-neutral-900">
            {title}
          </h1>
        </div>
        {step !== undefined && (
          <p className="sr-only">
            Etapa {step + 1} de {STEPS.length}: {STEPS[step]}
          </p>
        )}
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-5 pb-6 pt-2">{children}</main>

      {footer && (
        <div className="sticky bottom-0 z-20 bg-linear-to-t from-neutral-50 from-60% to-transparent px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
          <div className="mx-auto max-w-xl">{footer}</div>
        </div>
      )}
    </div>
  );
}
