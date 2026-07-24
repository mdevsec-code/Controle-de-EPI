import { Minus, Plus, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { FocusHeader } from "../../app/layout/focus-header";
import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { Textarea } from "../../shared/components/ui/textarea";
import { useDeliveryFlowStore } from "./store";

export function QuantitiesPage() {
  const navigate = useNavigate();
  const selected = useDeliveryFlowStore((state) => state.selected);
  const setQuantity = useDeliveryFlowStore((state) => state.setQuantity);
  const setNotes = useDeliveryFlowStore((state) => state.setNotes);
  const entries = Object.values(selected);

  if (entries.length === 0) {
    return <Navigate to="/entregas/nova/epis" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <FocusHeader title="Quantidade" />

      <div className="mx-auto w-full max-w-xl flex-1 space-y-4 px-4 py-6 sm:px-6">
        {entries.map(({ epi, quantity, notes }) => (
          <Card key={epi.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{epi.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">CA: {epi.ca}</p>
              </div>
            </div>

            <p className="mb-2 mt-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Quantidade
            </p>
            <div className="flex items-center overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setQuantity(epi.id, quantity - 1)}
                disabled={quantity <= 1}
                aria-label="Diminuir quantidade"
                className="flex h-11 flex-1 items-center justify-center text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-11 w-16 items-center justify-center border-x border-neutral-200 text-base font-semibold text-neutral-900 dark:border-neutral-700 dark:text-neutral-50">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(epi.id, quantity + 1)}
                aria-label="Aumentar quantidade"
                className="flex h-11 flex-1 items-center justify-center text-neutral-500 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-2 mt-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Observacoes (opcional)
            </p>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(epi.id, event.target.value)}
              maxLength={200}
              placeholder="Digite alguma observacao..."
            />
            <p className="mt-1 text-right text-xs text-neutral-400">{notes.length}/200</p>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4 sm:px-6 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mx-auto max-w-xl">
          <Button fullWidth size="lg" onClick={() => navigate("/entregas/nova/motivo")}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
