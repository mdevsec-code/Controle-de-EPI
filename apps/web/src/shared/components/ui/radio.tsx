import type { InputHTMLAttributes } from "react";

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Radio({ label, id, ...props }: RadioProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 select-none">
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input type="radio" id={id} className="peer sr-only" {...props} />
        <span className="h-5 w-5 rounded-full border-2 border-neutral-300 peer-checked:border-primary-600 dark:border-neutral-600" />
        <span className="absolute h-2.5 w-2.5 rounded-full bg-primary-600 opacity-0 peer-checked:opacity-100" />
      </span>
      {label && <span className="text-sm text-neutral-800 dark:text-neutral-100">{label}</span>}
    </label>
  );
}
