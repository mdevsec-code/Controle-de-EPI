import { ArrowRight, Briefcase, Building2, IdCard, Target } from "lucide-react";
import * as m from "motion/react-m";
import { Link, useNavigate } from "react-router-dom";
import { Stagger, StaggerItem } from "@/components/motion/primitives";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card } from "@/components/ui/surface";
import { EMPLOYEE_STATUS_LABEL } from "@/lib/labels";
import { EASE } from "@/lib/motion";
import { FlowLayout } from "./flow-layout";
import { useRequireDraftStep } from "./use-flow";

/** Etapa 2: "Funcionario encontrado" (mesmo layout da captura do legado). */
export function EmployeePage() {
  const navigate = useNavigate();
  const { draft, blocked } = useRequireDraftStep("epis");
  const employee = draft.employee;
  if (blocked || !employee) return null;

  const canReceive = employee.status === "ATIVO";
  const details = [
    { icon: IdCard, label: "Matrícula", value: employee.registration },
    { icon: Briefcase, label: "Função", value: employee.jobRoleName },
    { icon: Building2, label: "Empresa", value: employee.companyName },
    { icon: Target, label: "Centro de custo", value: employee.costCenter ?? "—" },
  ];

  return (
    <FlowLayout
      title="Funcionário encontrado"
      step={0}
      backTo="/entregas/nova"
      footer={
        <>
          <Button
            size="lg"
            fullWidth
            disabled={!canReceive}
            onClick={() => navigate("/entregas/nova/epis")}
            trailingIcon={<ArrowRight className="h-5 w-5" />}
          >
            Continuar
          </Button>
          {!canReceive && (
            <p role="alert" className="mt-2 text-center text-sm font-semibold text-danger-600">
              Colaborador {EMPLOYEE_STATUS_LABEL[employee.status].toLowerCase()} não pode receber
              EPIs.
            </p>
          )}
        </>
      }
    >
      <div className="flex flex-col items-center pt-4 text-center">
        <m.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
        >
          <Avatar
            name={employee.name}
            photoUrl={employee.photoUrl}
            className="h-28 w-28 border-4 border-white text-3xl shadow-(--shadow-card)"
          />
        </m.div>
        <m.h2
          className="mt-3.5 text-[19px] font-extrabold text-neutral-900"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3, ease: EASE }}
        >
          {employee.name}
        </m.h2>
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Badge tone={canReceive ? "primary" : "danger"} className="mt-2">
            {EMPLOYEE_STATUS_LABEL[employee.status]}
          </Badge>
        </m.div>
      </div>

      <Card className="mt-6 px-1">
        <Stagger as="ul" className="divide-y divide-neutral-100" delay={0.15}>
          {details.map((d) => (
            <StaggerItem
              as="li"
              key={d.label}
              className="flex items-center gap-3 px-3 py-3.5 text-[13.5px]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-150 text-neutral-500">
                <d.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex-1 text-neutral-500">{d.label}</span>
              <span className="text-right font-bold text-neutral-900">{d.value}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </Card>

      <p className="mt-5 text-center text-sm">
        <Link to="/entregas/nova" className="font-semibold text-primary-700 hover:underline">
          Não é este colaborador? Buscar outro
        </Link>
      </p>
    </FlowLayout>
  );
}
