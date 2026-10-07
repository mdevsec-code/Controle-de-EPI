import { DELIVERY_REASONS } from "@epi-manager/contracts";
import { ArrowRight } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useNavigate } from "react-router-dom";
import { Stagger, StaggerItem } from "@/components/motion/primitives";
import { Button } from "@/components/ui/button";
import { RadioRow } from "@/components/ui/choice";
import { Field, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/surface";
import { DELIVERY_REASON_LABEL } from "@/lib/labels";
import { EASE } from "@/lib/motion";
import { firstIncompleteStep, useDeliveryDraft } from "../draft";
import { FlowLayout } from "./flow-layout";
import { useRequireDraftStep } from "./use-flow";

/** Etapa 5: "Motivo da entrega" do legado (os 8 motivos; "Outro" pede descricao). */
export function ReasonPage() {
  const navigate = useNavigate();
  const { draft, blocked } = useRequireDraftStep("motivo");
  const setReason = useDeliveryDraft((s) => s.setReason);
  const setReasonDetail = useDeliveryDraft((s) => s.setReasonDetail);
  if (blocked) return null;

  const complete = firstIncompleteStep(draft) === null;

  return (
    <FlowLayout
      title="Motivo da entrega"
      step={3}
      backTo="/entregas/nova/quantidades"
      footer={
        <Button
          size="lg"
          fullWidth
          disabled={!complete}
          onClick={() => navigate("/entregas/nova/assinatura")}
          trailingIcon={<ArrowRight className="h-5 w-5" />}
        >
          Continuar
        </Button>
      }
    >
      <Card className="overflow-hidden py-2">
        <fieldset>
          <legend className="px-4 pb-1 pt-3 text-[13.5px] font-bold text-neutral-900">
            Selecione o motivo
          </legend>
          <Stagger>
            {DELIVERY_REASONS.map((reason) => (
              <StaggerItem key={reason}>
                <RadioRow
                  name="reason"
                  value={reason}
                  checked={draft.reason === reason}
                  onChange={() => setReason(reason)}
                  label={DELIVERY_REASON_LABEL[reason]}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </fieldset>
      </Card>

      <AnimatePresence initial={false}>
        {draft.reason === "OUTRO" && (
          <m.div
            key="detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <Field className="pt-4" label="Descreva o motivo" required>
              <Textarea
                value={draft.reasonDetail}
                maxLength={200}
                onChange={(e) => setReasonDetail(e.target.value)}
                placeholder="Ex.: troca por tamanho"
              />
            </Field>
          </m.div>
        )}
      </AnimatePresence>
    </FlowLayout>
  );
}
