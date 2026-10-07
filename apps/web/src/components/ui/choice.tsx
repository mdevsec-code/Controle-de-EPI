import * as m from "motion/react-m";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";

interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
  /** Conteudo a direita (ex.: saldo em estoque). */
  aside?: ReactNode;
}

/** Marcadores do legado: quadrado laranja com check / anel laranja com ponto. */
function Indicator({ type, checked }: { type: "checkbox" | "radio"; checked?: boolean }) {
  if (type === "radio") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "relative flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
          checked ? "border-primary-500" : "border-neutral-300",
          "peer-focus-visible:ring-4 peer-focus-visible:ring-primary-400/30",
        )}
      >
        <m.span
          className="h-3 w-3 rounded-full bg-primary-500"
          initial={false}
          animate={{ scale: checked ? 1 : 0 }}
          transition={{ duration: 0.15, ease: EASE }}
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 transition-colors duration-150",
        checked ? "border-primary-500 bg-primary-500" : "border-neutral-300 bg-white",
        "peer-focus-visible:ring-4 peer-focus-visible:ring-primary-400/30",
      )}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white">
        <m.path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.18, ease: EASE }}
        />
      </svg>
    </span>
  );
}

/**
 * Linha de opcao (lista dentro de um card, como nas telas do legado). O input nativo cobre a
 * linha inteira: toque, clique, teclado e leitor de tela usam o controle real.
 */
function Row({
  type,
  label,
  description,
  aside,
  className,
  checked,
  disabled,
  ...props
}: ChoiceProps & { type: "checkbox" | "radio" }) {
  return (
    <label
      className={cn(
        "relative flex min-h-[54px] cursor-pointer items-center gap-3.5 px-4 py-3 transition-colors duration-150",
        checked ? "bg-primary-50" : "hover:bg-neutral-50",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        type={type}
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        checked={checked}
        disabled={disabled}
        {...props}
      />
      <Indicator type={type} checked={checked} />
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-bold text-neutral-900">{label}</span>
        {description && <span className="block text-xs text-neutral-500">{description}</span>}
      </span>
      {aside && <span className="shrink-0">{aside}</span>}
    </label>
  );
}

export const CheckboxRow = (props: ChoiceProps) => <Row type="checkbox" {...props} />;
export const RadioRow = (props: ChoiceProps) => <Row type="radio" {...props} />;
