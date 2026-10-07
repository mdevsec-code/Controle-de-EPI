import type { DashboardSummaryDto } from "@epi-manager/contracts";
import {
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  HardHat,
  MapPin,
  PackagePlus,
  QrCode,
  Users,
  Warehouse,
} from "lucide-react";
import * as m from "motion/react-m";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CountUp, Stagger, StaggerItem } from "@/components/motion/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/feedback";
import { Avatar, Badge, Card } from "@/components/ui/surface";
import { useActiveWarehouse, useCurrentUser } from "@/features/auth/auth-api";
import { useSessionStore } from "@/features/auth/session-store";
import { useDashboardSummary } from "@/features/deliveries/api";
import { useStartDelivery } from "@/features/deliveries/flow/use-flow";
import { useStockItems } from "@/features/stock/api";
import { variantLabel } from "@/features/stock/stock-groups";
import { cn } from "@/lib/cn";
import { formatDeliveryNumber, formatShortWhen } from "@/lib/format";
import { EASE } from "@/lib/motion";

const longDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

function greeting(now = new Date()) {
  const hour = now.getHours();
  return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
}

/** Grafico de barras dos ultimos 7 dias (dentro do painel laranja). */
function WeekChart({ week }: { week: DashboardSummaryDto["week"] }) {
  const max = Math.max(1, ...week.map((d) => d.deliveries));
  const total = week.reduce((sum, d) => sum + d.deliveries, 0);
  return (
    <figure className="flex h-full flex-col">
      <figcaption className="flex items-baseline justify-between text-sm font-semibold text-white/90">
        Últimos 7 dias
        <span className="text-xs font-medium text-white/75">{total} entregas</span>
      </figcaption>
      <ol className="mt-4 flex flex-1 items-end gap-3" aria-label="Entregas por dia">
        {week.map((day, i) => {
          const isToday = i === week.length - 1;
          const label = weekday.format(new Date(`${day.date}T12:00:00`)).replace(".", "");
          return (
            <li
              key={day.date}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="text-xs font-bold tabular text-white">{day.deliveries}</span>
              <span className="flex h-24 w-full items-end">
                <m.span
                  aria-hidden="true"
                  className={cn(
                    "block w-full origin-bottom rounded-t-lg",
                    isToday ? "bg-white" : "bg-white/35",
                  )}
                  style={{ height: `${Math.max(6, (day.deliveries / max) * 100)}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.15 + i * 0.04, duration: 0.45, ease: EASE }}
                />
              </span>
              <span
                className={cn(
                  "text-xs capitalize",
                  isToday ? "font-bold text-white" : "text-white/75",
                )}
              >
                {isToday ? "Hoje" : label}
                <span className="sr-only">: {day.deliveries} entregas</span>
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

function SideCard({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: typeof AlertTriangle;
  tone: "warning" | "primary";
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2.5 text-[14.5px] font-bold text-neutral-900">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            tone === "warning"
              ? "bg-warning-50 text-warning-700"
              : "bg-primary-100 text-primary-600",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {title}
      </h2>
      {children}
    </Card>
  );
}

/** Estoque abaixo do minimo no almoxarifado ativo (atalho para repor). */
function LowStockCard({ count }: { count: number }) {
  const warehouse = useActiveWarehouse();
  const low = useStockItems(
    { warehouseId: warehouse?.id, lowStock: true, pageSize: 4 },
    Boolean(warehouse) && count > 0,
  );
  return (
    <SideCard icon={AlertTriangle} tone="warning" title="Atenção no estoque">
      {count === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">Todos os itens estão acima do mínimo.</p>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {low.data?.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-[13px]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-neutral-900">
                    {item.epiName}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">
                    {variantLabel(item)}
                  </span>
                </span>
                <span className="font-bold tabular text-warning-700">{item.quantity}</span>
                <span className="text-xs text-neutral-400">/ mín. {item.minQuantity}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/estoque?baixo=1"
            className="mt-4 flex items-center justify-between text-[13px] font-bold text-primary-700 hover:underline"
          >
            Ver {count} {count === 1 ? "item" : "itens"} abaixo do mínimo
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      )}
    </SideCard>
  );
}

const SHORTCUTS = [
  { to: "/estoque", label: "Estoque", icon: Warehouse },
  { to: "/entregas", label: "Histórico", icon: ClipboardList },
  { to: "/colaboradores", label: "Colaboradores", icon: Users },
  { to: "/epis", label: "EPIs", icon: HardHat },
];

/**
 * Inicio no computador: mesma identidade do legado (laranja, cards brancos, avatares pessego),
 * organizada como painel: acoes no topo, resumo + semana no destaque e colunas de trabalho.
 */
export function DesktopHome() {
  const user = useCurrentUser();
  const warehouse = useActiveWarehouse();
  const setActiveWarehouse = useSessionStore((s) => s.setActiveWarehouse);
  const summary = useDashboardSummary();
  const startDelivery = useStartDelivery();
  const navigate = useNavigate();
  const firstName = user.name.split(" ")[0];
  const data = summary.data;

  const kpis = [
    { label: "Entregas hoje", value: data?.today.deliveries },
    { label: "Funcionários atendidos", value: data?.today.employeesServed },
    { label: "Tipos de EPI entregues", value: data?.today.epiTypes },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-8 py-8 xl:px-10">
      <m.header
        className="flex flex-wrap items-end justify-between gap-4"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <div>
          <p className="text-sm font-medium text-neutral-500 first-letter:uppercase">
            {longDate.format(new Date())}
          </p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight text-neutral-900">
            {greeting()}, {firstName}!
          </h1>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-600">
            <Warehouse className="h-4 w-4 text-primary-500" aria-hidden="true" />
            {user.warehouses.length > 1 ? (
              <select
                aria-label="Almoxarifado"
                value={warehouse?.id ?? ""}
                onChange={(e) => setActiveWarehouse(e.target.value)}
                className="cursor-pointer rounded-lg bg-transparent py-1 pr-1 font-semibold text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                {user.warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-neutral-900">{warehouse?.name ?? "—"}</span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              startDelivery();
              navigate("/entregas/nova/scanner");
            }}
          >
            <QrCode className="h-4 w-4" aria-hidden="true" />
            Escanear QR Code
          </Button>
          <Button onClick={startDelivery}>
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Nova entrega
          </Button>
        </div>
      </m.header>

      {/* Destaque: o cabecalho laranja do legado, agora como painel largo com o resumo e a semana */}
      <m.section
        aria-label="Resumo"
        className="relative mt-6 grid grid-cols-[1.15fr_1fr] gap-8 overflow-hidden rounded-[28px] bg-linear-135 from-primary-400 via-primary-500 to-primary-600 p-7 text-white shadow-(--shadow-cta)"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35, ease: EASE }}
      >
        <span
          aria-hidden="true"
          className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/[0.07]"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-white/[0.07]"
        />
        <div className="relative flex flex-col">
          <h2 className="text-sm font-semibold text-white/90">Resumo de hoje</h2>
          {summary.isError ? (
            <div className="mt-4 rounded-2xl bg-white p-2">
              <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
            </div>
          ) : (
            <dl className="mt-4 grid flex-1 grid-cols-3 gap-3">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="flex flex-col-reverse justify-end rounded-2xl bg-white/[0.12] p-4"
                >
                  <dt className="mt-1 text-[13px] leading-snug text-white/85">{kpi.label}</dt>
                  <dd className="font-display text-[34px] font-extrabold leading-none">
                    {kpi.value === undefined ? (
                      <span
                        className="skeleton block h-9 w-12 rounded-lg opacity-40"
                        aria-hidden="true"
                      />
                    ) : (
                      <CountUp value={kpi.value} />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="relative border-l border-white/20 pl-8">
          {data ? (
            <WeekChart week={data.week} />
          ) : (
            <span
              className="skeleton block h-full min-h-40 rounded-2xl opacity-30"
              aria-hidden="true"
            />
          )}
        </div>
      </m.section>

      <div className="mt-6 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35, ease: EASE }}
        >
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <h2 className="text-[14.5px] font-bold text-neutral-900">Últimas entregas</h2>
              <Link
                to="/entregas"
                className="text-[13px] font-bold text-primary-700 hover:underline"
              >
                Ver todas
              </Link>
            </div>
            {summary.isPending ? (
              <SkeletonList rows={5} label="Carregando últimas entregas..." />
            ) : !data || data.recentDeliveries.length === 0 ? (
              <EmptyState
                title="Nenhuma entrega ainda"
                description="As entregas registradas aparecerão aqui."
              />
            ) : (
              <table className="w-full text-left text-[13.5px]">
                <thead className="border-y border-neutral-100 bg-neutral-50 text-xs font-semibold text-neutral-500">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 font-semibold">
                      Colaborador
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">
                      EPIs
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                      Qtd.
                    </th>
                    <th scope="col" className="px-5 py-2.5 text-right font-semibold">
                      Quando
                    </th>
                  </tr>
                </thead>
                <Stagger as="tbody" className="divide-y divide-neutral-100" delay={0.2}>
                  {data.recentDeliveries.map((d) => (
                    <StaggerItem
                      as="tr"
                      key={d.id}
                      className="transition-colors duration-150 hover:bg-primary-50"
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/entregas/${d.id}`}
                          className="flex items-center gap-3 focus:outline-none focus-visible:underline"
                          aria-label={`Entrega ${formatDeliveryNumber(d.number)} para ${d.employeeName}`}
                        >
                          <Avatar name={d.employeeName} className="h-9 w-9" />
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-neutral-900">
                              {d.employeeName}
                            </span>
                            <span className="block text-xs text-neutral-500">
                              Matrícula: {d.employeeRegistration}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="max-w-56 truncate px-3 py-3 text-neutral-600">
                        {d.items.map((i) => i.epiName).join(", ")}
                      </td>
                      <td className="px-3 py-3 text-right font-bold tabular text-neutral-900">
                        {d.totalQuantity}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <time
                          dateTime={d.deliveredAt}
                          className="text-xs font-semibold text-neutral-500"
                        >
                          {formatShortWhen(d.deliveredAt)}
                        </time>
                      </td>
                    </StaggerItem>
                  ))}
                </Stagger>
              </table>
            )}
          </Card>
        </m.div>

        <Stagger className="space-y-4" delay={0.15} step={0.06}>
          <StaggerItem>
            <LowStockCard count={data?.lowStockCount ?? 0} />
          </StaggerItem>
          <StaggerItem>
            <SideCard icon={MapPin} tone="primary" title="Organização do estoque">
              {data && data.unplacedStockCount > 0 ? (
                <>
                  <p className="mt-3 text-sm text-neutral-600">
                    <strong className="text-neutral-900">{data.unplacedStockCount}</strong>{" "}
                    {data.unplacedStockCount === 1
                      ? "item com saldo está"
                      : "itens com saldo estão"}{" "}
                    sem local de armazenamento marcado.
                  </p>
                  <Link
                    to="/estoque?local=sem"
                    className="mt-4 flex items-center justify-between text-[13px] font-bold text-primary-700 hover:underline"
                  >
                    Marcar locais
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
                  {data ? (
                    <>
                      <Badge tone="success">OK</Badge> Todos os itens têm local definido.
                    </>
                  ) : (
                    "Carregando..."
                  )}
                </p>
              )}
            </SideCard>
          </StaggerItem>
          <StaggerItem>
            <nav aria-label="Atalhos" className="grid grid-cols-2 gap-3">
              {SHORTCUTS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-start gap-2 rounded-2xl bg-white p-4 text-[13.5px] font-bold text-neutral-900 shadow-(--shadow-card) transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <Icon className="h-5 w-5 text-primary-500" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          </StaggerItem>
        </Stagger>
      </div>
    </div>
  );
}
