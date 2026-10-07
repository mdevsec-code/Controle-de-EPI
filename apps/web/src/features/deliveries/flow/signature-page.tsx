import { Check } from "lucide-react";
import * as m from "motion/react-m";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/feedback";
import { Card } from "@/components/ui/surface";
import { isApiError } from "@/lib/errors";
import { DELIVERY_REASON_LABEL, sizeLabel } from "@/lib/labels";
import { EASE } from "@/lib/motion";
import { useRegisterDelivery } from "../api";
import { toCreateRequest, totalQuantity, useDeliveryDraft } from "../draft";
import { FlowLayout } from "./flow-layout";
import { SignaturePad } from "./signature-pad";
import { useRequireDraftStep } from "./use-flow";

/** Etapa 6: "Assinatura" do legado, com a conferencia do que esta sendo assinado. So aqui algo e gravado. */
export function SignaturePage() {
  const navigate = useNavigate();
  const { draft, blocked } = useRequireDraftStep("assinatura");
  const complete = useDeliveryDraft((s) => s.complete);
  const register = useRegisterDelivery();
  const [signature, setSignature] = useState<string | null>(null);
  const onSignatureChange = useCallback((value: string | null) => setSignature(value), []);
  if (blocked || !draft.employee || !draft.reason) return null;

  const submit = () => {
    if (!signature || register.isPending) return;
    register.mutate(toCreateRequest(draft, signature), {
      onSuccess: (delivery) => {
        complete(delivery);
        navigate("/entregas/nova/concluida", { replace: true });
      },
    });
  };

  const stockProblem =
    isApiError(register.error, "ESTOQUE_INSUFICIENTE") || isApiError(register.error, "CA_INVALIDO");

  return (
    <FlowLayout
      title="Assinatura"
      step={4}
      backTo="/entregas/nova/motivo"
      footer={
        <Button
          size="lg"
          fullWidth
          disabled={!signature}
          loading={register.isPending}
          onClick={submit}
          trailingIcon={<Check className="h-5 w-5" />}
        >
          {register.isPending ? "Registrando..." : "Confirmar assinatura"}
        </Button>
      }
    >
      <m.div
        className="text-center"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <h2 className="text-[17px] font-bold text-neutral-900">{draft.employee.name}</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Assine abaixo para confirmar o recebimento
        </p>
      </m.div>

      <m.section
        aria-label="Resumo da entrega"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.3, ease: EASE }}
      >
        <Card className="mt-4 px-4 py-3 text-[13px]">
          <ul className="space-y-1">
            {Object.values(draft.items).map(({ stock, quantity }) => (
              <li key={stock.id} className="flex items-baseline gap-2">
                <span className="font-bold text-primary-600">{quantity}×</span>
                <span className="flex-1 font-semibold text-neutral-900">
                  {[stock.epiName, sizeLabel(stock.size)].filter(Boolean).join(" · ")}
                </span>
                <span className="text-xs text-neutral-500">CA {stock.caNumber}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-neutral-100 pt-2 text-neutral-500">
            Total <strong className="text-neutral-900">{totalQuantity(draft)} un.</strong> · Motivo{" "}
            <strong className="text-neutral-900">
              {DELIVERY_REASON_LABEL[draft.reason]}
              {draft.reason === "OUTRO" && draft.reasonDetail ? ` (${draft.reasonDetail})` : ""}
            </strong>
          </p>
        </Card>
      </m.section>

      <m.div
        className="mt-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.3, ease: EASE }}
      >
        <SignaturePad onChange={onSignatureChange} disabled={register.isPending} />
      </m.div>

      {register.isError && (
        <div className="mt-4 space-y-2">
          <InlineError error={register.error} />
          {stockProblem && (
            <p className="text-center text-sm">
              <Link
                to="/entregas/nova/epis"
                className="font-semibold text-primary-700 underline underline-offset-4"
              >
                Revisar EPIs e quantidades
              </Link>
            </p>
          )}
        </div>
      )}
    </FlowLayout>
  );
}
