import { Eye, EyeOff } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

/** Campo do legado: borda 1,5 px clara, raio 14 px, borda laranja no foco. */
const control =
  "w-full rounded-control border-[1.5px] border-neutral-100 bg-white px-4 text-[15px] text-neutral-900 transition-colors duration-150 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none disabled:bg-neutral-50 aria-[invalid=true]:border-danger-500";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  ref?: Ref<HTMLInputElement>;
  /** Icone a esquerda dentro do campo (usuario, cadeado...). */
  icon?: ReactNode;
};

export function Input({ className, ref, icon, ...props }: InputProps) {
  if (!icon) return <input ref={ref} className={cn(control, "min-h-13", className)} {...props} />;
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-neutral-400"
      >
        {icon}
      </span>
      <input ref={ref} className={cn(control, "min-h-13 pl-11", className)} {...props} />
    </div>
  );
}

/**
 * Senha com botao mostrar/ocultar. id e aria-* (vindos do Field) vao para o <input>,
 * nao para o wrapper, para o rotulo continuar associado ao campo.
 */
export function PasswordInput({ className, ref, icon, ...props }: Omit<InputProps, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      {icon && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-neutral-400"
        >
          {icon}
        </span>
      )}
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn(control, "min-h-13 pr-12", icon && "pl-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-700"
      >
        {visible ? (
          <EyeOff className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Eye className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export function Textarea({
  className,
  ref,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return (
    <textarea
      ref={ref}
      className={cn(control, "min-h-24 resize-none py-3", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ref,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return <select ref={ref} className={cn(control, "min-h-13 pr-8", className)} {...props} />;
}

interface FieldProps {
  label: string;
  /** Um unico controle (Input/Select/Textarea): recebe id, aria-invalid e aria-describedby. */
  children: ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    required?: boolean;
  }>;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  /** Rotulo so para leitores de tela (campos do login, que no legado mostram so o placeholder). */
  hideLabel?: boolean;
  className?: string;
}

/** Label + controle + dica + erro, com associacao acessivel automatica. */
export function Field({
  label,
  children,
  error,
  hint,
  required,
  hideLabel,
  className,
}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(hideLabel ? "sr-only" : "block text-[13px] font-bold text-neutral-600")}
      >
        {label}
        {required && (
          <span className="text-primary-700" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {isValidElement(children) &&
        cloneElement(children, {
          id,
          "aria-invalid": Boolean(error),
          "aria-describedby": describedBy,
          required,
        })}
      {hint && (
        <p id={hintId} className="text-right text-xs text-neutral-500">
          {hint}
        </p>
      )}
      <AnimatePresence initial={false}>
        {error && (
          <m.p
            id={errorId}
            role="alert"
            className="text-sm font-medium text-danger-600"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  );
}
