import { CheckCircle2, X, XCircle } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { useToastStore } from "./toast-store";

/** Toast do legado (tarja escura que sobe da base). Regiao anunciada por leitores de tela. */
export function ToastRegion() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-5 lg:bottom-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <m.div
            key={t.id}
            layout
            role={t.tone === "error" ? "alert" : "status"}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-center gap-2.5 rounded-control px-4 py-3.5 text-[13px] font-semibold text-white shadow-[0_12px_24px_rgb(0_0_0/0.25)]",
              t.tone === "success" ? "bg-neutral-900" : "bg-danger-700",
            )}
          >
            {t.tone === "success" ? (
              <CheckCircle2
                className="h-[18px] w-[18px] shrink-0 text-primary-400"
                aria-hidden="true"
              />
            ) : (
              <XCircle className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Fechar aviso"
              className="-m-1 rounded-lg p-1 hover:bg-white/10"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
