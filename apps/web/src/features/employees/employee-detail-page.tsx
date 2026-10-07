import { EMPLOYEE_STATUSES, type EmployeeDto, type EmployeeStatus } from "@epi-manager/contracts";
import { Pencil, Printer, RefreshCw } from "lucide-react";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState, InlineError, Spinner } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { Avatar, Badge, Card, DetailRow, PageHeader } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast-store";
import { useHasRole } from "@/features/auth/auth-api";
import { cjsDefault } from "@/lib/cjs-interop";
import { formatDate } from "@/lib/format";
import { EMPLOYEE_STATUS_LABEL } from "@/lib/labels";
import { EASE } from "@/lib/motion";
import { useChangeEmployeeStatus, useEmployee, useReissueBadge } from "./api";
import { EmployeeForm } from "./employee-form";

/** QR do cracha gerado no navegador (biblioteca carregada so aqui). Contem so o codigo opaco. */
function BadgeQr({ employee }: { employee: EmployeeDto }) {
  const [svg, setSvg] = useState<string | null>(null);
  const reissue = useReissueBadge(employee.id);

  useEffect(() => {
    if (!employee.badgeCode) return;
    let active = true;
    void import("qrcode").then((module) =>
      cjsDefault(module)
        .toString(employee.badgeCode!, { type: "svg", margin: 1, errorCorrectionLevel: "M" })
        .then((value) => {
          if (active) setSvg(value);
        }),
    );
    return () => {
      active = false;
    };
  }, [employee.badgeCode]);

  return (
    <m.section
      aria-label="QR Code do crachá"
      className="rounded-card bg-white p-5 shadow-(--shadow-card)"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.3, ease: EASE }}
    >
      <h2 className="text-[14.5px] font-bold text-neutral-900">QR Code do crachá</h2>
      <div className="relative mx-auto mt-4 w-48 rounded-2xl bg-white p-3">
        {[
          "left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl",
          "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl",
          "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
          "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
        ].map((pos) => (
          <span
            key={pos}
            aria-hidden="true"
            className={`absolute -m-1.5 h-7 w-7 border-primary-400 ${pos}`}
          />
        ))}
        {svg ? (
          // SVG gerado localmente pela biblioteca a partir do codigo (sem conteudo do usuario).
          <m.img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
            alt={`QR Code do crachá de ${employee.name}`}
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: EASE }}
          />
        ) : (
          <Spinner label="Gerando QR..." />
        )}
      </div>
      <p className="mt-4 text-center text-xs text-neutral-500">
        O QR contém apenas um código aleatório. Reemita se o crachá for perdido: o anterior deixa de
        funcionar.
      </p>
      <div className="no-print mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Imprimir
        </Button>
        <Button
          variant="outline"
          size="sm"
          loading={reissue.isPending}
          onClick={() =>
            reissue.mutate(undefined, {
              onSuccess: () => toast.success("Novo QR emitido. Imprima o crachá novamente."),
            })
          }
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reemitir
        </Button>
      </div>
    </m.section>
  );
}

function StatusForm({ employee, onDone }: { employee: EmployeeDto; onDone: () => void }) {
  const change = useChangeEmployeeStatus(employee.id);
  const [status, setStatus] = useState<EmployeeStatus>(
    employee.status === "ATIVO" ? "BLOQUEADO" : "ATIVO",
  );
  const [terminationDate, setTerminationDate] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        change.mutate(
          { status, terminationDate: status === "DESLIGADO" ? terminationDate : undefined },
          {
            onSuccess: () => {
              toast.success("Situação atualizada.");
              onDone();
            },
          },
        );
      }}
    >
      <Field label="Nova situação">
        <Select value={status} onChange={(e) => setStatus(e.target.value as EmployeeStatus)}>
          {EMPLOYEE_STATUSES.filter((s) => s !== employee.status).map((s) => (
            <option key={s} value={s}>
              {EMPLOYEE_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </Field>
      {status === "DESLIGADO" && (
        <Field label="Data de desligamento" required>
          <Input
            type="date"
            value={terminationDate}
            onChange={(e) => setTerminationDate(e.target.value)}
          />
        </Field>
      )}
      <InlineError error={change.error} />
      <Button
        type="submit"
        fullWidth
        loading={change.isPending}
        disabled={status === "DESLIGADO" && !terminationDate}
      >
        Confirmar
      </Button>
    </form>
  );
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isAdmin = useHasRole("ADMIN");
  const employee = useEmployee(id);
  const [dialog, setDialog] = useState<"edit" | "status" | null>(null);

  if (employee.isPending) return <Spinner />;
  if (employee.isError)
    return <ErrorState error={employee.error} onRetry={() => void employee.refetch()} />;
  const e = employee.data;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:px-8 lg:py-10">
      <PageHeader
        title={e.name}
        description={`Matrícula ${e.registration} · ${e.jobRoleName} · ${e.departmentName}`}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Link
              to={`/entregas?colaborador=${e.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Entregas
            </Link>
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={() => setDialog("status")}>
                  Alterar situação
                </Button>
                <Button size="sm" onClick={() => setDialog("edit")}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Editar
                </Button>
              </>
            )}
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card>
          <div className="flex items-center gap-3 border-b border-neutral-100 p-4">
            <Avatar name={e.name} photoUrl={e.photoUrl} className="h-14 w-14" />
            <Badge tone={e.status === "ATIVO" ? "primary" : "danger"}>
              {EMPLOYEE_STATUS_LABEL[e.status]}
            </Badge>
          </div>
          <dl className="divide-y divide-neutral-100">
            <DetailRow label="CPF">{e.cpf}</DetailRow>
            <DetailRow label="Função">{e.jobRoleName}</DetailRow>
            <DetailRow label="Setor">{e.departmentName}</DetailRow>
            <DetailRow label="Unidade">{e.businessUnitName}</DetailRow>
            <DetailRow label="Empresa">{e.companyName}</DetailRow>
            <DetailRow label="Centro de custo">{e.costCenter ?? "—"}</DetailRow>
            <DetailRow label="Admissão">
              {e.admissionDate ? formatDate(e.admissionDate) : "—"}
            </DetailRow>
            {e.terminationDate && (
              <DetailRow label="Desligamento">{formatDate(e.terminationDate)}</DetailRow>
            )}
          </dl>
        </Card>
        {isAdmin && e.badgeCode && <BadgeQr employee={e} />}
      </div>

      <Dialog open={dialog === "edit"} onClose={() => setDialog(null)} title="Editar colaborador">
        {dialog === "edit" && <EmployeeForm employee={e} onDone={() => setDialog(null)} />}
      </Dialog>
      <Dialog open={dialog === "status"} onClose={() => setDialog(null)} title="Alterar situação">
        {dialog === "status" && <StatusForm employee={e} onDone={() => setDialog(null)} />}
      </Dialog>
    </div>
  );
}
