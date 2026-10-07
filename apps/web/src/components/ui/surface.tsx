import { cva, type VariantProps } from "class-variance-authority";
import * as m from "motion/react-m";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { EASE } from "@/lib/motion";

/** Card branco do legado: raio 20 px e sombra suave. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-card bg-white shadow-(--shadow-card)", className)} {...props} />
  );
}

/** Pilulas de status do legado (ponto + texto). */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold",
  {
    variants: {
      tone: {
        neutral: "bg-neutral-150 text-neutral-600",
        primary: "bg-primary-100 text-primary-700",
        success: "bg-success-50 text-success-700",
        warning: "bg-warning-50 text-warning-700",
        danger: "bg-danger-50 text-danger-700",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  tone,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** Avatar do legado: circulo pessego com iniciais laranja (ou foto). */
export function Avatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
}) {
  const base =
    "flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-full";
  if (photoUrl) {
    return (
      <img src={photoUrl} alt="" className={cn(base, "object-cover", className)} loading="lazy" />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        base,
        "bg-linear-135 from-primary-200 to-primary-300 font-display text-sm font-bold text-primary-600",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Titulo de pagina das telas de gestao (mesma tipografia do legado). */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <m.div
      className="mb-5 flex flex-wrap items-end justify-between gap-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </m.div>
  );
}

/** Linha rotulo/valor (cards de detalhe do legado). */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 text-[13.5px]">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-bold text-neutral-900">{children}</dd>
    </div>
  );
}

/** Titulo de secao + link "Ver todas" do legado. */
export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-6 flex items-center justify-between">
      <h2 className="text-[14.5px] font-bold text-neutral-900">{title}</h2>
      {action}
    </div>
  );
}
