import * as m from "motion/react-m";
import { Link, Navigate } from "react-router-dom";
import { AnimatedCheck, Confetti, Stagger, StaggerItem } from "@/components/motion/primitives";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { DELIVERY_REASON_LABEL } from "@/lib/labels";
import { EASE, SPRING_POP } from "@/lib/motion";
import { useDeliveryDraft } from "../draft";
import { useStartDelivery } from "./use-flow";

/**
 * "Entrega registrada com sucesso!" do legado. Exibida SO com os dados devolvidos pela API
 * (a entrega foi de fato gravada).
 */
export function SuccessPage() {
  const result = useDeliveryDraft((s) => s.result);
  const startDelivery = useStartDelivery();
  if (!result) return <Navigate to="/entregas/nova" replace />;

  const total = result.items.reduce((sum, item) => sum + item.quantity, 0);
  const rows = [
    { label: "Funcionário", value: result.employee.name },
    { label: "Matrícula", value: result.employee.registration },
    { label: "EPI entregue", value: result.items.map((i) => i.epiName).join(", ") },
    { label: "Quantidade", value: String(total) },
    { label: "Motivo", value: DELIVERY_REASON_LABEL[result.reason] },
    { label: "Responsável", value: `${result.deliveredBy.name} (Almoxarifado)` },
    { label: "Data e hora", value: formatDateTime(result.deliveredAt) },
  ];

  return (
    <div className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-neutral-900 px-4 pb-8 pt-[calc(2.5rem+env(safe-area-inset-top))] text-white">
      <Confetti />

      <m.span
        className="relative flex h-[84px] w-[84px] items-center justify-center rounded-full bg-white text-primary-500"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={SPRING_POP}
      >
        <AnimatedCheck className="h-11 w-11" delay={0.2} />
      </m.span>

      <m.div
        className="relative mt-5 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35, ease: EASE }}
      >
        <h1 className="text-2xl font-bold leading-tight" aria-live="polite">
          Entrega registrada
          <span className="block text-primary-400">com sucesso!</span>
        </h1>
        <p className="mx-auto mt-2 max-w-60 text-[13px] text-neutral-300">
          O recebimento foi registrado com todas as informações.
        </p>
        <p className="mt-1 text-xs text-neutral-400">Entrega nº {result.number}</p>
      </m.div>

      <m.section
        aria-label="Resumo"
        className="relative mt-6 w-full max-w-md rounded-card bg-white p-4 text-neutral-900"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4, ease: EASE }}
      >
        <Stagger delay={0.35} step={0.03}>
          <dl>
            {rows.map((row) => (
              <StaggerItem key={row.label} className="flex gap-4 py-1.5 text-[13.5px]">
                <dt className="w-28 shrink-0 text-neutral-400">{row.label}</dt>
                <dd className="font-bold">{row.value}</dd>
              </StaggerItem>
            ))}
          </dl>
        </Stagger>

        <div className="mt-4 grid gap-2.5">
          <Button size="lg" fullWidth onClick={startDelivery}>
            Nova entrega
          </Button>
          <Link
            to={`/entregas/${result.id}/comprovante`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            Ver comprovante
          </Link>
          <Link
            to="/"
            className="mx-auto mt-1 text-sm font-semibold text-neutral-500 hover:underline"
          >
            Voltar ao início
          </Link>
        </div>
      </m.section>
    </div>
  );
}
