import type { DeliveryListItemDto } from "@epi-manager/contracts";
import { ChevronRight, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/controls";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/feedback";
import { Card, PageHeader } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import {
  formatDeliveryNumber,
  formatTime,
  PERIOD_LABEL,
  periodRange,
  type Period,
} from "@/lib/format";
import { EASE, SPRING_SNAPPY } from "@/lib/motion";
import { useDeliveries } from "./api";

const PERIODS: Period[] = ["hoje", "ontem", "semana", "mes"];
const PAGE_SIZE = 30;

const dayLabel = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

/** Agrupa por dia local, mantendo a ordem (mais recente primeiro). */
function groupByDay(items: DeliveryListItemDto[]) {
  const groups: { key: string; label: string; items: DeliveryListItemDto[] }[] = [];
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  for (const item of items) {
    const date = new Date(item.deliveredAt);
    const key = date.toDateString();
    const label = key === today ? "Hoje" : key === yesterday ? "Ontem" : dayLabel.format(date);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, label, items: [item] });
  }
  return groups;
}

export function HistoryPage() {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<Period>("hoje");
  const [page, setPage] = useState(1);
  const [params, setParams] = useSearchParams();
  // Vindo da ficha do colaborador: todas as entregas dele, sem limite de periodo.
  const employeeId = params.get("colaborador") ?? undefined;
  const range = useMemo(() => periodRange(period), [period]);
  const deliveries = useDeliveries({
    q: query.trim() || undefined,
    employeeId,
    from: employeeId ? undefined : range.from,
    to: employeeId ? undefined : range.to,
    page,
    pageSize: PAGE_SIZE,
  });
  const groups = useMemo(() => groupByDay(deliveries.data?.items ?? []), [deliveries.data]);

  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:py-10">
      <PageHeader title="Histórico de entregas" />

      <SearchInput
        label="Buscar entregas por nome ou matrícula do colaborador"
        placeholder="Buscar por nome ou matrícula"
        value={query}
        onChange={(v) => changeFilter(() => setQuery(v))}
      />

      {employeeId ? (
        <m.p
          className="mt-3 flex items-center justify-between gap-2 rounded-control bg-primary-50 px-4 py-3 text-sm text-neutral-900"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          Mostrando todas as entregas de um colaborador.
          <button
            type="button"
            className="flex items-center gap-1 font-semibold text-primary-700 hover:underline"
            onClick={() => setParams({}, { replace: true })}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Limpar filtro
          </button>
        </m.p>
      ) : (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Período">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => changeFilter(() => setPeriod(p))}
              className={cn(
                "relative min-h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition-colors duration-150",
                period === p
                  ? "text-white"
                  : "bg-neutral-150 text-neutral-600 hover:bg-neutral-100",
              )}
            >
              {period === p && (
                <m.span
                  layoutId="period-pill"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-primary-500"
                  transition={SPRING_SNAPPY}
                />
              )}
              <span className="relative">{PERIOD_LABEL[p]}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4" aria-busy={deliveries.isFetching}>
        {deliveries.isPending ? (
          <Card className="overflow-hidden">
            <SkeletonList rows={6} label="Carregando entregas..." />
          </Card>
        ) : deliveries.isError ? (
          <Card>
            <ErrorState error={deliveries.error} onRetry={() => void deliveries.refetch()} />
          </Card>
        ) : deliveries.data.items.length === 0 ? (
          <Card>
            <EmptyState
              title="Nenhuma entrega encontrada"
              description="Ajuste o período ou a busca."
            />
          </Card>
        ) : (
          <AnimatePresence mode="wait">
            <m.div
              key={`${period}-${query}-${page}-${employeeId ?? ""}`}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {groups.map((group) => (
                <section key={group.key} aria-label={group.label}>
                  {groups.length > 1 && (
                    <h2 className="mb-2 text-xs font-bold text-neutral-500 first-letter:uppercase">
                      {group.label}
                    </h2>
                  )}
                  <ul className="space-y-2.5">
                    {group.items.map((d, index) => (
                      <m.li
                        key={d.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: Math.min(index, 10) * 0.03,
                          duration: 0.3,
                          ease: EASE,
                        }}
                      >
                        <Link
                          to={`/entregas/${d.id}`}
                          className="flex items-center gap-3.5 rounded-2xl bg-white px-4 py-3.5 shadow-(--shadow-card) transition-transform duration-150 active:scale-[0.98]"
                        >
                          <time
                            dateTime={d.deliveredAt}
                            className="w-11 shrink-0 text-[13px] font-semibold text-neutral-600"
                          >
                            {formatTime(d.deliveredAt)}
                          </time>
                          <span aria-hidden="true" className="h-10 w-px bg-neutral-100" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-bold text-neutral-900">
                              {d.employeeName}
                            </span>
                            <span className="block truncate text-[13px] text-neutral-600">
                              {d.items.map((i) => i.epiName).join(", ")}
                            </span>
                          </span>
                          <span className="shrink-0 self-end text-right text-xs text-neutral-600">
                            {d.totalQuantity} un.
                            <span className="sr-only">
                              {" "}
                              · entrega {formatDeliveryNumber(d.number)}
                            </span>
                          </span>
                          <ChevronRight
                            className="h-5 w-5 shrink-0 text-neutral-900"
                            aria-hidden="true"
                          />
                        </Link>
                      </m.li>
                    ))}
                  </ul>
                </section>
              ))}
            </m.div>
          </AnimatePresence>
        )}
      </div>

      {deliveries.data && deliveries.data.total > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-between gap-3 text-sm text-neutral-600">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-xs">
            Página {page} de {Math.ceil(deliveries.data.total / PAGE_SIZE)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page * PAGE_SIZE >= deliveries.data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
