import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
      primary: "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200",
      success: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
      warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
      danger: "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
