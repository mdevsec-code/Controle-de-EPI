import { Minus, Plus, Search, X } from "lucide-react";
import { useEffect, useState, type InputHTMLAttributes } from "react";
import logoUrl from "@/assets/engenova-logo.svg";
import markUrl from "@/assets/engenova-mark.svg";
import { NumberRoll } from "@/components/motion/primitives";
import { cn } from "@/lib/cn";

/** Barra de busca do legado, com debounce: evita uma requisicao por tecla digitada. */
export function SearchInput({
  value,
  onChange,
  label,
  delay = 300,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  /** Rotulo acessivel (visualmente oculto). */
  label: string;
  delay?: number;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onChange(draft), delay);
    return () => clearTimeout(timer);
  }, [draft, value, delay, onChange]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400"
        aria-hidden="true"
      />
      <input
        type="search"
        aria-label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="min-h-12 w-full rounded-control border-[1.5px] border-neutral-100 bg-white pl-11 pr-11 text-[14.5px] transition-colors duration-150 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            onChange("");
          }}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Stepper do legado: [ − ] valor [ + ] em caixa com bordas, sinais laranja; o numero "rola". */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const btn =
    "flex min-h-14 flex-1 items-center justify-center text-primary-500 transition-colors duration-150 hover:bg-neutral-50 active:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300";
  return (
    <div
      role="group"
      aria-label={label}
      className="flex overflow-hidden rounded-2xl border-[1.5px] border-neutral-100 bg-white"
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Diminuir"
      >
        <Minus className="h-6 w-6" aria-hidden="true" />
      </button>
      <output
        aria-live="polite"
        className="flex w-24 items-center justify-center border-x-[1.5px] border-neutral-100"
      >
        <NumberRoll
          value={value}
          className="font-display text-[26px] font-extrabold text-neutral-900"
        />
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Aumentar"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Logo vetorial (SVG redesenhado a partir do PNG do legado): nitida em qualquer tamanho e
 * sem a caixa de fundo do PNG. `mark` = so o predio, para espacos pequenos.
 */
export function Logo({
  className,
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "mark";
}) {
  const full = variant === "full";
  return (
    <img
      src={full ? logoUrl : markUrl}
      alt="ENGENOVA Engenharia e Construção"
      width={full ? 266 : 90}
      height={full ? 119 : 102}
      className={cn("h-auto max-w-full", full ? "w-48" : "w-10", className)}
    />
  );
}
