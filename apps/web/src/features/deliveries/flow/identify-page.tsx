import type { EmployeeSummaryDto } from "@epi-manager/contracts";
import { ChevronRight, QrCode } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchInput } from "@/components/ui/controls";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/feedback";
import { Field, Select } from "@/components/ui/field";
import { Avatar, Badge, Card } from "@/components/ui/surface";
import { useSessionStore } from "@/features/auth/session-store";
import { useEmployees } from "@/features/employees/api";
import { EMPLOYEE_STATUS_LABEL } from "@/lib/labels";
import { EASE } from "@/lib/motion";
import { useDeliveryDraft } from "../draft";
import { FlowLayout } from "./flow-layout";

/** Etapa 1: identificar o colaborador por QR do cracha ou busca (tela "Buscar Funcionario" do legado). */
export function IdentifyPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const user = useSessionStore((s) => s.user);
  const activeWarehouseId = useSessionStore((s) => s.activeWarehouseId);
  const setActiveWarehouse = useSessionStore((s) => s.setActiveWarehouse);
  const draftWarehouse = useDeliveryDraft((s) => s.warehouseId);
  const hasResult = useDeliveryDraft((s) => s.result !== null);
  const start = useDeliveryDraft((s) => s.start);
  const setEmployee = useDeliveryDraft((s) => s.setEmployee);

  // Entregue a anterior ou trocou de almoxarifado: comeca do zero.
  useEffect(() => {
    if (hasResult || draftWarehouse !== activeWarehouseId) start(activeWarehouseId);
  }, [hasResult, draftWarehouse, activeWarehouseId, start]);

  const search = query.trim();
  const employees = useEmployees({ q: search, pageSize: 20 }, search.length >= 2);

  const choose = (employee: EmployeeSummaryDto) => {
    setEmployee(employee);
    navigate("/entregas/nova/colaborador");
  };

  const warehouses = user?.warehouses ?? [];

  return (
    <FlowLayout title="Buscar Funcionário" step={0} backTo="/">
      {warehouses.length === 0 ? (
        <EmptyState
          title="Nenhum almoxarifado vinculado"
          description="Peça ao administrador para vincular seu usuário a um almoxarifado antes de registrar entregas."
        />
      ) : (
        <div className="space-y-4">
          {warehouses.length > 1 && (
            <Field label="Almoxarifado">
              <Select
                value={activeWarehouseId ?? ""}
                onChange={(e) => setActiveWarehouse(e.target.value)}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <SearchInput
            label="Buscar colaborador por nome ou matrícula"
            placeholder="Buscar por nome ou matrícula"
            value={query}
            onChange={setQuery}
            autoComplete="off"
          />

          <Link
            to="/entregas/nova/scanner"
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-(--shadow-card) transition-transform duration-150 active:scale-[0.98]"
          >
            <span className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-primary-100 text-primary-500">
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block text-[13.5px] font-bold text-neutral-900">
                Escanear QR Code do crachá
              </span>
              <span className="block text-xs text-neutral-500">Identificação mais rápida</span>
            </span>
            <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden="true" />
          </Link>

          <AnimatePresence mode="wait">
            {search.length >= 2 && (
              <m.div
                key="results"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {employees.isPending ? (
                  <Card className="overflow-hidden">
                    <SkeletonList rows={3} label="Buscando colaboradores..." />
                  </Card>
                ) : employees.isError ? (
                  <Card>
                    <ErrorState error={employees.error} onRetry={() => void employees.refetch()} />
                  </Card>
                ) : employees.data.items.length === 0 ? (
                  <Card>
                    <EmptyState
                      title="Nenhum funcionário encontrado"
                      description="Confira o nome ou a matrícula."
                    />
                  </Card>
                ) : (
                  <ul className="space-y-2.5">
                    {employees.data.items.map((employee, index) => (
                      <m.li
                        key={employee.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.25, ease: EASE }}
                      >
                        <button
                          type="button"
                          onClick={() => choose(employee)}
                          className="flex w-full items-center gap-3 rounded-2xl bg-white px-3.5 py-3 text-left shadow-(--shadow-card) transition-transform duration-150 active:scale-[0.98]"
                        >
                          <Avatar name={employee.name} photoUrl={employee.photoUrl} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-bold text-neutral-900">
                              {employee.name}
                            </span>
                            <span className="block truncate text-xs text-neutral-500">
                              Matrícula: {employee.registration} · {employee.jobRoleName}
                            </span>
                          </span>
                          {employee.status !== "ATIVO" && (
                            <Badge tone="danger">{EMPLOYEE_STATUS_LABEL[employee.status]}</Badge>
                          )}
                        </button>
                      </m.li>
                    ))}
                  </ul>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </FlowLayout>
  );
}
