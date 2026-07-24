import type { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, id, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 select-none">
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input type="checkbox" id={id} className="peer sr-only" {...props} />
        <span className="h-5 w-5 rounded border border-neutral-300 bg-white peer-checked:border-primary-600 peer-checked:bg-primary-600 dark:border-neutral-600 dark:bg-neutral-800" />
        <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" />
      </span>
      {label && <span className="text-sm text-neutral-800 dark:text-neutral-100">{label}</span>}
    </label>
  );
}
