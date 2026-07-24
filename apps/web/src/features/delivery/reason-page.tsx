import { useNavigate } from "react-router-dom";
import { FocusHeader } from "../../app/layout/focus-header";
import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { Radio } from "../../shared/components/ui/radio";
import { DELIVERY_REASONS } from "./mock-data";
import { useDeliveryFlowStore } from "./store";

export function ReasonPage() {
  const navigate = useNavigate();
  const reason = useDeliveryFlowStore((state) => state.reason);
  const setReason = useDeliveryFlowStore((state) => state.setReason);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <FocusHeader title="Motivo da entrega" />

      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6">
        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Selecione o motivo
          </p>
          <div className="space-y-1">
            {DELIVERY_REASONS.map((option) => (
              <div key={option} className="rounded-md px-2 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700">
                <Radio
                  id={`reason-${option}`}
                  name="reason"
                  checked={reason === option}
                  onChange={() => setReason(option)}
                  label={option}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4 sm:px-6 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mx-auto max-w-xl">
          <Button
            fullWidth
            size="lg"
            disabled={!reason}
            onClick={() => navigate("/entregas/nova/assinatura")}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
