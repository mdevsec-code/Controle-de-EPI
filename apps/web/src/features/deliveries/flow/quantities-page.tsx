import { ITEM_NOTES_MAX_LENGTH } from "@epi-manager/contracts";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Stagger, StaggerItem } from "@/components/motion/primitives";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/controls";
import { Field, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/surface";
import { epiIcon } from "@/lib/epi-icons";
import { sizeLabel } from "@/lib/labels";
import { maxQuantityFor, useDeliveryDraft } from "../draft";
import { FlowLayout } from "./flow-layout";
import { useRequireDraftStep } from "./use-flow";

/** Etapa 4: "Quantidade" do legado (card do EPI, stepper e observacoes), um bloco por EPI. */
export function QuantitiesPage() {
  const navigate = useNavigate();
  const { draft, blocked } = useRequireDraftStep("motivo");
  const setQuantity = useDeliveryDraft((s) => s.setQuantity);
  const setNotes = useDeliveryDraft((s) => s.setNotes);
  if (blocked) return null;

  return (
    <FlowLayout
      title="Quantidade"
      step={2}
      backTo="/entregas/nova/epis"
      footer={
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate("/entregas/nova/motivo")}
          trailingIcon={<ArrowRight className="h-5 w-5" />}
        >
          Continuar
        </Button>
      }
    >
      <Stagger className="space-y-7" step={0.06}>
        {Object.values(draft.items).map(({ stock, quantity, notes }) => {
          const title = [stock.epiName, sizeLabel(stock.size)].filter(Boolean).join(" · ");
          const Icon = epiIcon(stock.categoryName, stock.epiName);
          return (
            <StaggerItem key={stock.id}>
              <Card className="flex items-center gap-3.5 p-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-150 text-primary-500">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-[15.5px] font-extrabold text-neutral-900">
                    {title}
                  </h2>
                  <p className="mt-0.5 font-mono text-[12.5px] text-neutral-500">
                    CA: {stock.caNumber}
                  </p>
                </div>
              </Card>

              <p className="mb-2 mt-5 text-[13px] font-bold text-neutral-600">Quantidade</p>
              <QuantityStepper
                label={`Quantidade de ${title}`}
                value={quantity}
                max={maxQuantityFor(stock)}
                onChange={(value) => setQuantity(stock.id, value)}
              />
              <p className="mt-1.5 text-xs text-neutral-500">{stock.quantity} em estoque</p>

              <Field
                className="mt-4"
                label="Observações (opcional)"
                hint={`${notes.length}/${ITEM_NOTES_MAX_LENGTH}`}
              >
                <Textarea
                  value={notes}
                  maxLength={ITEM_NOTES_MAX_LENGTH}
                  placeholder="Digite alguma observação..."
                  onChange={(e) => setNotes(stock.id, e.target.value)}
                />
              </Field>
            </StaggerItem>
          );
        })}
      </Stagger>
    </FlowLayout>
  );
}
