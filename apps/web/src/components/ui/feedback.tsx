import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";
import * as m from "motion/react-m";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { EASE } from "@/lib/motion";
import { Button } from "./button";

export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-12 text-sm text-neutral-500"
    >
      <span className="relative h-5 w-5" aria-hidden="true">
        <span className="absolute inset-0 rounded-full border-2 border-neutral-100" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary-500" />
      </span>
      <span>{label}</span>
    </div>
  );
}

/** Esqueleto de lista: forma do conteudo enquanto carrega. */
export function SkeletonList({
  rows = 5,
  label = "Carregando...",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" className="divide-y divide-neutral-100">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden="true" className="flex items-center gap-3 px-4 py-3.5">
          <span className="skeleton h-[42px] w-[42px] shrink-0 rounded-full" />
          <span className="flex-1 space-y-2">
            <span
              className="skeleton block h-3.5 rounded-full"
              style={{ width: `${60 - (i % 3) * 12}%` }}
            />
            <span className="skeleton block h-3 w-1/3 rounded-full" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <m.div
      className="flex flex-col items-center gap-2 px-6 py-10 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <Inbox className="h-8 w-8 text-neutral-400" aria-hidden="true" />
      <p className="font-bold text-neutral-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-neutral-500">{description}</p>}
      {action}
    </m.div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <AlertTriangle className="h-8 w-8 text-danger-600" aria-hidden="true" />
      <p className="max-w-sm text-sm font-medium text-neutral-800">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

/** Mensagem de erro inline (ex.: falha ao enviar um formulario). */
export function InlineError({ error, className }: { error: unknown; className?: string }) {
  if (!error) return null;
  return (
    <m.p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-control bg-danger-50 px-3.5 py-3 text-sm font-medium text-danger-700",
        className,
      )}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {errorMessage(error)}
    </m.p>
  );
}
