import { Briefcase, Building2, IdCard, Target } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { FocusHeader } from "../../app/layout/focus-header";
import { Avatar } from "../../shared/components/avatar";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { useDeliveryFlowStore } from "./store";

const STATUS_VARIANT = {
  Ativo: "success",
  Bloqueado: "danger",
  Inativo: "neutral",
} as const;

const DETAILS = [
  { key: "registration", label: "Matricula", icon: IdCard },
  { key: "role", label: "Funcao", icon: Briefcase },
  { key: "company", label: "Empresa", icon: Building2 },
  { key: "costCenter", label: "Centro de custo", icon: Target },
] as const;

export function EmployeeFoundPage() {
  const navigate = useNavigate();
  const employee = useDeliveryFlowStore((state) => state.employee);

  if (!employee) {
    return <Navigate to="/entregas/nova" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <FocusHeader title="Funcionario encontrado" />

      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-3">
          <Avatar name={employee.name} className="h-20 w-20 text-xl" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{employee.name}</h2>
          <Badge variant={STATUS_VARIANT[employee.status]}>{employee.status}</Badge>
        </div>

        <Card className="mt-6 divide-y divide-neutral-100 dark:divide-neutral-700">
          {DETAILS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-3 p-4">
              <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
              <span className="flex-1 text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {employee[key]}
              </span>
            </div>
          ))}
        </Card>
      </div>

      <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4 sm:px-6 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mx-auto max-w-xl">
          <Button
            fullWidth
            size="lg"
            onClick={() => navigate("/entregas/nova/epis")}
            disabled={employee.status !== "Ativo"}
          >
            Continuar
          </Button>
          {employee.status !== "Ativo" && (
            <p className="mt-2 text-center text-xs text-danger-600">
              Este funcionario esta {employee.status.toLowerCase()} e nao pode receber EPIs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
