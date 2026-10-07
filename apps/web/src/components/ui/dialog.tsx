import { X } from "lucide-react";
import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { EASE } from "@/lib/motion";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Modal sobre o <dialog> nativo (foco preso, Esc fecha, fundo inerte). No celular sobe da base,
 * como o drawer do legado; no desktop aparece centralizado. Entrada/saida curtas.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const titleId = useId();
  const reduce = useReducedMotion();
  // Mantem o conteudo montado durante a animacao de saida.
  const [rendered, setRendered] = useState(open);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      setRendered(true);
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => {
        if (scope.current && !reduce) {
          void animate(
            scope.current,
            { opacity: [0, 1], y: [32, 0] },
            { duration: 0.3, ease: EASE },
          );
        }
      });
    } else if (dialog.open) {
      const finish = () => {
        dialog.close();
        setRendered(false);
      };
      if (scope.current && !reduce) {
        void animate(scope.current, { opacity: 0, y: 24 }, { duration: 0.18 }).then(finish);
      } else {
        finish();
      }
    }
  }, [open, animate, scope, reduce]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-visible bg-transparent p-0 backdrop:bg-[rgb(10_10_14/0.45)] sm:m-auto sm:max-w-lg"
    >
      {rendered && (
        <div
          ref={scope}
          className="flex max-h-[92dvh] flex-col overflow-hidden rounded-t-sheet bg-white shadow-(--shadow-pop) sm:rounded-sheet"
        >
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3.5">
            <h2 id={titleId} className="text-base font-bold text-neutral-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/5 text-neutral-700 transition-colors hover:bg-neutral-900/10"
            >
              <X className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
        </div>
      )}
    </dialog>
  );
}
