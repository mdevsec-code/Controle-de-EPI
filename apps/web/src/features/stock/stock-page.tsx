import {
  STOCK_MOVEMENT_TYPES,
  type StockItemDto,
  type StockMovementType,
} from "@epi-manager/contracts";
import { ArrowRight, Boxes, MapPin, PackagePlus } from "lucide-react";
import * as m from "motion/react-m";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/feedback";
import { Field, Select } from "@/components/ui/field";
import { Card, PageHeader } from "@/components/ui/surface";
import { useActiveWarehouse } from "@/features/auth/auth-api";
import { useSessionStore } from "@/features/auth/session-store";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { MOVEMENT_TYPE_LABEL, sizeLabel } from "@/lib/labels";
import { EASE, SPRING_SNAPPY } from "@/lib/motion";
import { useStockItems, useStockLocations, useStockMovements } from "./api";
import { StockByLocation } from "./stock-by-location";
import { StockAdjustmentForm, StockEntryForm } from "./stock-forms";
import { StockGroupCard } from "./stock-group-card";
import { groupStock, NO_LOCATION } from "./stock-groups";
import { LocationForm } from "./stock-location";

type View = "epi" | "local";
const ALL = "__all";
const NONE = "__none";

function Balances({ warehouseId }: { warehouseId: string }) {
  const [params, setParams] = useSearchParams();
  const lowStock = params.get("baixo") === "1";
  const [query, setQuery] = useState("");
  // "?local=sem" (atalho do inicio) abre filtrando os itens sem local.
  const [location, setLocation] = useState(params.get("local") === "sem" ? NONE : ALL);
  const [view, setView] = useState<View>("epi");
  const [adjusting, setAdjusting] = useState<StockItemDto | null>(null);
  const [locating, setLocating] = useState<StockItemDto[] | null>(null);
  const locations = useStockLocations(warehouseId);
  const stock = useStockItems({
    warehouseId,
    q: query.trim() || undefined,
    lowStock: lowStock || undefined,
    pageSize: 100,
  });

  const items = useMemo(() => {
    const all = stock.data?.items ?? [];
    if (location === ALL) return all;
    return all.filter((i) => (location === NONE ? !i.location : i.location === location));
  }, [stock.data, location]);
  const groups = useMemo(() => groupStock(items), [items]);
  const unplaced = (stock.data?.items ?? []).filter((i) => !i.location).length;

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <SearchInput
          label="Buscar EPI ou local no estoque"
          placeholder="Buscar EPI ou local"
          value={query}
          onChange={setQuery}
        />
        <Select
          aria-label="Filtrar por local"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="min-h-12 lg:w-60"
        >
          <option value={ALL}>Todos os locais</option>
          {locations.data?.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
          <option value={NONE}>{NO_LOCATION}</option>
        </Select>
        <div
          role="group"
          aria-label="Organizar estoque"
          className="flex rounded-control border-[1.5px] border-neutral-100 bg-white p-1"
        >
          {(
            [
              ["epi", "Por EPI", Boxes],
              ["local", "Por local", MapPin],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={cn(
                "relative flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] px-4 text-[13px] font-semibold transition-colors duration-150",
                view === value ? "text-white" : "text-neutral-600 hover:text-neutral-900",
              )}
            >
              {view === value && (
                <m.span
                  layoutId="stock-view"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[10px] bg-primary-500"
                  transition={SPRING_SNAPPY}
                />
              )}
              <Icon className="relative h-4 w-4" aria-hidden="true" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-neutral-700">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={lowStock}
            onChange={(e) => setParams(e.target.checked ? { baixo: "1" } : {}, { replace: true })}
          />
          <span
            aria-hidden="true"
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors duration-200 peer-focus-visible:ring-4 peer-focus-visible:ring-primary-500/30",
              lowStock ? "bg-primary-500" : "bg-neutral-300",
            )}
          >
            <m.span
              className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
              animate={{ left: lowStock ? 24 : 4 }}
              transition={SPRING_SNAPPY}
            />
          </span>
          Só abaixo do mínimo
        </label>
        {unplaced > 0 && location !== NONE && (
          <button
            type="button"
            onClick={() => setLocation(NONE)}
            className="flex items-center gap-1.5 rounded-full bg-warning-50 px-3.5 py-2 text-xs font-bold text-warning-700"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {unplaced} {unplaced === 1 ? "item sem local" : "itens sem local"}
          </button>
        )}
      </div>

      <div className="mt-5">
        {stock.isPending ? (
          <Card className="overflow-hidden">
            <SkeletonList rows={6} label="Carregando estoque..." />
          </Card>
        ) : stock.isError ? (
          <Card>
            <ErrorState error={stock.error} onRetry={() => void stock.refetch()} />
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              title="Nenhum item de estoque"
              description={
                location === ALL && !query && !lowStock
                  ? "Use “Entrada de material” para cadastrar o saldo."
                  : "Ajuste a busca ou os filtros."
              }
            />
          </Card>
        ) : view === "epi" ? (
          <ul className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((group, index) => (
              <StockGroupCard
                key={group.key}
                group={group}
                index={index}
                onAdjust={setAdjusting}
                onLocate={setLocating}
              />
            ))}
          </ul>
        ) : (
          <StockByLocation items={items} onAdjust={setAdjusting} onLocate={setLocating} />
        )}
        {stock.data && stock.data.total > stock.data.items.length && (
          <p className="mt-4 text-center text-xs text-neutral-500">
            Mostrando {stock.data.items.length} de {stock.data.total} itens. Refine a busca para ver
            os demais.
          </p>
        )}
      </div>

      <Dialog
        open={adjusting !== null}
        onClose={() => setAdjusting(null)}
        title="Movimentar estoque"
      >
        {adjusting && <StockAdjustmentForm item={adjusting} onDone={() => setAdjusting(null)} />}
      </Dialog>
      <Dialog
        open={locating !== null}
        onClose={() => setLocating(null)}
        title="Local de armazenamento"
      >
        {locating && (
          <LocationForm
            items={locating}
            warehouseId={warehouseId}
            onDone={() => setLocating(null)}
          />
        )}
      </Dialog>
    </>
  );
}

function Movements({ warehouseId }: { warehouseId: string }) {
  const [type, setType] = useState<StockMovementType | "">("");
  const movements = useStockMovements({ warehouseId, type: type || undefined, pageSize: 50 });

  return (
    <>
      <Field label="Tipo" className="max-w-xs">
        <Select value={type} onChange={(e) => setType(e.target.value as StockMovementType | "")}>
          <option value="">Todos</option>
          {STOCK_MOVEMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {MOVEMENT_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </Field>
      <Card className="mt-4 overflow-hidden">
        {movements.isPending ? (
          <SkeletonList rows={6} label="Carregando movimentações..." />
        ) : movements.isError ? (
          <ErrorState error={movements.error} onRetry={() => void movements.refetch()} />
        ) : movements.data.items.length === 0 ? (
          <EmptyState title="Nenhuma movimentação" />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {movements.data.items.map((mv, index) => {
              const out = mv.delta < 0;
              return (
                <m.li
                  key={mv.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.3, ease: EASE }}
                >
                  <span
                    className={cn(
                      "flex h-11 w-14 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold",
                      out ? "bg-danger-50 text-danger-700" : "bg-success-50 text-success-700",
                    )}
                  >
                    {mv.delta > 0 ? `+${mv.delta}` : mv.delta}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900">
                      {[mv.epiName, sizeLabel(mv.size)].filter(Boolean).join(" · ")}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {MOVEMENT_TYPE_LABEL[mv.type]} · {mv.performedByName} ·{" "}
                      {formatDateTime(mv.createdAt)}
                      {mv.reason && ` · ${mv.reason}`}
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 font-mono text-sm text-neutral-500">
                    {mv.balanceBefore}
                    <ArrowRight className="h-3.5 w-3.5" aria-label="para" />
                    <strong className="text-neutral-900">{mv.balanceAfter}</strong>
                  </span>
                </m.li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}

export function StockPage() {
  const user = useSessionStore((s) => s.user);
  const setActiveWarehouse = useSessionStore((s) => s.setActiveWarehouse);
  const warehouse = useActiveWarehouse();
  const [tab, setTab] = useState<"saldos" | "movimentacoes">("saldos");
  const [entryOpen, setEntryOpen] = useState(false);

  if (!warehouse) {
    return (
      <EmptyState
        title="Nenhum almoxarifado vinculado"
        description="Peça ao administrador para vincular seu usuário."
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:px-8 lg:py-10">
      <PageHeader
        title="Estoque"
        description={`${warehouse.name} · saldo por EPI, tamanho e lote`}
        actions={
          <Button onClick={() => setEntryOpen(true)}>
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Entrada de material
          </Button>
        }
      />

      {user && user.warehouses.length > 1 && (
        <Field label="Almoxarifado" className="mb-4 max-w-xs">
          <Select value={warehouse.id} onChange={(e) => setActiveWarehouse(e.target.value)}>
            {user.warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div
        role="tablist"
        aria-label="Visão do estoque"
        className="mb-5 flex gap-1 border-b border-neutral-100"
      >
        {(["saldos", "movimentacoes"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "relative min-h-12 px-4 text-sm font-semibold transition-colors",
              tab === t ? "text-primary-500" : "text-neutral-500 hover:text-neutral-800",
            )}
          >
            {t === "saldos" ? "Saldos" : "Movimentações"}
            {tab === t && (
              <m.span
                layoutId="stock-tab"
                aria-hidden="true"
                className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-primary-500"
                transition={SPRING_SNAPPY}
              />
            )}
          </button>
        ))}
      </div>

      {tab === "saldos" ? (
        <Balances warehouseId={warehouse.id} />
      ) : (
        <Movements warehouseId={warehouse.id} />
      )}

      <Dialog open={entryOpen} onClose={() => setEntryOpen(false)} title="Entrada de material">
        <StockEntryForm warehouseId={warehouse.id} onDone={() => setEntryOpen(false)} />
      </Dialog>
    </div>
  );
}
