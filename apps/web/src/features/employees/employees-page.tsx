import { EMPLOYEE_STATUSES, type EmployeeStatus } from "@epi-manager/contracts";
import { ChevronRight, Plus } from "lucide-react";
import * as m from "motion/react-m";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/feedback";
import { Field, Select } from "@/components/ui/field";
import { Avatar, Badge, Card, PageHeader } from "@/components/ui/surface";
import { useHasRole } from "@/features/auth/auth-api";
import { EMPLOYEE_STATUS_LABEL } from "@/lib/labels";
import { EASE } from "@/lib/motion";
import { useEmployees } from "./api";
import { EmployeeForm } from "./employee-form";

export function EmployeesPage() {
  const isAdmin = useHasRole("ADMIN");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "">("ATIVO");
  const [creating, setCreating] = useState(false);
  const employees = useEmployees({
    q: query.trim() || undefined,
    status: status || undefined,
    pageSize: 50,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:px-8 lg:py-10">
      <PageHeader
        title="Colaboradores"
        description="Quem recebe EPI. Cada um tem um crachá com QR Code próprio."
        actions={
          isAdmin && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo colaborador
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-end gap-3">
        <SearchInput
          className="min-w-60 flex-1"
          label="Buscar por nome ou matrícula"
          placeholder="Nome ou matrícula"
          value={query}
          onChange={setQuery}
        />
        <Field label="Situação" className="w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value as EmployeeStatus | "")}>
            <option value="">Todas</option>
            {EMPLOYEE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {EMPLOYEE_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-5">
        {employees.isPending ? (
          <Card className="overflow-hidden">
            <SkeletonList rows={6} label="Carregando colaboradores..." />
          </Card>
        ) : employees.isError ? (
          <Card>
            <ErrorState error={employees.error} onRetry={() => void employees.refetch()} />
          </Card>
        ) : employees.data.items.length === 0 ? (
          <Card>
            <EmptyState title="Nenhum colaborador encontrado" />
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {employees.data.items.map((e, index) => (
              <m.li
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.3, ease: EASE }}
              >
                <Link
                  to={`/colaboradores/${e.id}`}
                  className="flex h-full items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-(--shadow-card) transition-transform duration-150 active:scale-[0.98]"
                >
                  <Avatar name={e.name} photoUrl={e.photoUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-neutral-900">
                      {e.name}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">
                      Matrícula: {e.registration} · {e.jobRoleName}
                    </span>
                  </span>
                  {e.status !== "ATIVO" && (
                    <Badge tone="danger">{EMPLOYEE_STATUS_LABEL[e.status]}</Badge>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                </Link>
              </m.li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={creating} onClose={() => setCreating(false)} title="Novo colaborador">
        {creating && (
          <EmployeeForm
            onDone={(saved) => {
              setCreating(false);
              navigate(`/colaboradores/${saved.id}`);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
