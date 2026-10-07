import { cva } from "class-variance-authority";

/** Botoes do prototipo legado: gradiente laranja com sombra, escala .98 ao toque. */
export const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 overflow-hidden font-semibold transition-[transform,box-shadow,background-color,opacity] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-135 from-primary-400 to-primary-500 text-white shadow-(--shadow-cta) hover:brightness-105",
        outline: "border-[1.5px] border-neutral-100 bg-white text-neutral-900 hover:bg-neutral-50",
        secondary: "bg-neutral-150 text-neutral-900 hover:bg-neutral-100",
        ghost: "bg-transparent text-neutral-600 hover:bg-neutral-900/5",
        danger: "bg-danger-600 text-white hover:bg-danger-700",
      },
      size: {
        sm: "min-h-9 rounded-[10px] px-3.5 text-sm",
        md: "min-h-11 rounded-control px-4 text-sm",
        lg: "min-h-14 rounded-2xl px-6 font-display text-[15.5px] font-bold uppercase tracking-[0.04em]",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
