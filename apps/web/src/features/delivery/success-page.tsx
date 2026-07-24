import { CheckCircle2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { useDeliveryFlowStore } from "./store";

export function SuccessPage() {
  const navigate = useNavigate();
  const employee = useDeliveryFlowStore((state) => state.employee);
  const selected = useDeliveryFlowStore((state) => state.selected);
  const reason = useDeliveryFlowStore((state) => state.reason);
  const reset = useDeliveryFlowStore((state) => state.reset);

  const entries = Object.values(selected);

  if (!employee || entries.length === 0) {
    return <Navigate to="/entregas/nova" replace />;
  }

  const epiSummary = entries.map((entry) => entry.epi.name).join(", ");
  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const now = new Date();
  const formattedDate = now.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const summary = [
    { label: "Funcionario", value: employee.name },
    { label: "Matricula", value: employee.registration },
    { label: "EPI entregue", value: epiSummary },
    { label: "Quantidade", value: String(totalQuantity) },
    { label: "Motivo", value: reason ?? "-" },
    { label: "Responsavel", value: "Marcio (Almoxarifado)" },
    { label: "Data e hora", value: formattedDate },
  ];

  const handleNewDelivery = () => {
    reset();
    navigate("/entregas/nova");
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-neutral-900 px-4 py-10 text-white sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-success-500">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <h1 className="mt-5 text-xl font-semibold">Entrega registrada</h1>
      <p className="text-lg font-semibold text-primary-400">com sucesso!</p>
      <p className="mt-2 max-w-xs text-center text-sm text-neutral-300">
        O recebimento foi registrado com todas as informacoes.
      </p>

      <Card className="mt-8 w-full max-w-md divide-y divide-neutral-100 bg-white dark:divide-neutral-700">
        {summary.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 p-4">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{item.label}</span>
            <span className="text-right text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {item.value}
            </span>
          </div>
        ))}
      </Card>

      <div className="mt-6 w-full max-w-md space-y-3">
        <Button fullWidth size="lg" onClick={handleNewDelivery}>
          Nova entrega
        </Button>
        <Button fullWidth size="lg" variant="outline" className="border-neutral-600 text-white hover:bg-white/10" onClick={() => window.print()}>
          Ver comprovante
        </Button>
      </div>
    </div>
  );
}
