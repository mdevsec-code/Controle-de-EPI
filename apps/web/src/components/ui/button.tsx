import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "./button-variants";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Desabilita e mostra indicador: evita submissoes duplicadas. */
  loading?: boolean;
  /** Icone encostado na borda direita (ex.: seta do "CONTINUAR" do legado). */
  trailingIcon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  loading,
  disabled,
  children,
  trailingIcon,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
      {children}
      {trailingIcon && !loading && (
        <span aria-hidden="true" className="absolute right-5 flex items-center">
          {trailingIcon}
        </span>
      )}
    </button>
  );
}
