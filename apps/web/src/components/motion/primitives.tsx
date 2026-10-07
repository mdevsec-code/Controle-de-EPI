import {
  animate,
  AnimatePresence,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";
import * as m from "motion/react-m";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EASE, fadeUp, stagger } from "@/lib/motion";

/** Container que revela os filhos em cascata curta (use com <StaggerItem>). */
export function Stagger({
  children,
  className,
  delay = 0,
  step = 0.035,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  step?: number;
  as?: "div" | "ul" | "tbody";
}) {
  const Comp = as === "ul" ? m.ul : as === "tbody" ? m.tbody : m.div;
  return (
    <Comp className={className} variants={stagger(step, delay)} initial="hidden" animate="show">
      {children}
    </Comp>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
  ...props
}: { children: ReactNode; className?: string; as?: "div" | "li" | "tr" } & Omit<
  HTMLMotionProps<"div">,
  "children"
>) {
  const Comp = as === "li" ? m.li : as === "tr" ? m.tr : m.div;
  return (
    <Comp className={className} variants={fadeUp} {...(props as object)}>
      {children}
    </Comp>
  );
}

/** Numero que conta ate o valor (rapido e discreto). */
export function CountUp({
  value,
  className,
  duration = 0.6,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) => Math.round(v).toLocaleString("pt-BR"));

  useEffect(() => {
    if (reduce) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration, ease: EASE });
    return () => controls.stop();
  }, [value, duration, reduce, motionValue]);

  return (
    <span className={cn("tabular", className)}>
      <span className="sr-only">{value}</span>
      <m.span aria-hidden="true">{display}</m.span>
    </span>
  );
}

/** Valor que "rola" verticalmente ao mudar (stepper de quantidade). */
export function NumberRoll({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("relative inline-flex overflow-hidden tabular", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={value}
          initial={{ y: "-70%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "70%", opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="inline-block"
        >
          {value}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

/** Check desenhado (usado dentro do circulo de sucesso). */
export function AnimatedCheck({ className, delay = 0.2 }: { className?: string; delay?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <m.path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay, ease: EASE }}
      />
    </svg>
  );
}

/** Pseudoaleatorio deterministico (render estavel). */
function seeded(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const CONFETTI_COLORS = ["#FF8A3D", "#EE5A24", "#1E8F5E", "#FFFFFF"];

/**
 * Confetes do prototipo legado (pecas pequenas espalhadas no topo), agora caindo devagar
 * e sumindo. Sem animacao quando o usuario pede menos movimento.
 */
export function Confetti({ count = 18 }: { count?: number }) {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const left = seeded(i) * 100;
        const top = seeded(i + 50) * 55;
        const w = 4 + seeded(i + 100) * 4;
        const h = 4 + seeded(i + 150) * 10;
        const rotate = seeded(i + 200) * 360;
        return (
          <m.i
            key={i}
            className="absolute block rounded-[2px]"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: w,
              height: h,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            }}
            initial={{ opacity: 0, y: -24, rotate }}
            animate={
              reduce
                ? { opacity: 0.8, y: 0, rotate }
                : { opacity: [0, 0.85, 0.85, 0], y: [-24, 0, 40, 90], rotate: rotate + 120 }
            }
            transition={{
              duration: reduce ? 0 : 2.6 + seeded(i + 250),
              delay: seeded(i + 300) * 0.5,
              ease: "easeOut",
              times: [0, 0.15, 0.7, 1],
            }}
          />
        );
      })}
    </div>
  );
}
