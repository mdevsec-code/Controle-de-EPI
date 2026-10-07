import { Bell, ChevronDown, QrCode, UserSearch } from "lucide-react";
import * as m from "motion/react-m";
import { Link, useNavigate } from "react-router-dom";
import { CountUp, Stagger, StaggerItem } from "@/components/motion/primitives";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/feedback";
import { Avatar, Card } from "@/components/ui/surface";
import { useActiveWarehouse, useCurrentUser } from "@/features/auth/auth-api";
import { useSessionStore } from "@/features/auth/session-store";
import { useDashboardSummary } from "@/features/deliveries/api";
import { useStartDelivery } from "@/features/deliveries/flow/use-flow";
import { formatShortWhen } from "@/lib/format";
import { EASE } from "@/lib/motion";

function ActionCard({
  icon: Icon,
  line1,
  line2,
  onClick,
}: {
  icon: typeof QrCode;
  line1: string;
  line2: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-32 w-full flex-col items-center justify-center gap-2.5 rounded-[18px] bg-white p-4 text-center shadow-(--shadow-card) transition-transform duration-150 active:scale-[0.96]"
    >
      <Icon className="h-9 w-9 text-primary-500" strokeWidth={1.6} aria-hidden="true" />
      <span className="text-[15px] font-bold leading-tight text-neutral-900">
        {line1}
        <br />
        <span className="font-medium">{line2}</span>
      </span>
    </button>
  );
}

/** Inicio no celular = Home do legado: cabecalho laranja, atalhos, resumo do dia e ultimas entregas. */
export function MobileHome() {
  const user = useCurrentUser();
  const warehouse = useActiveWarehouse();
  const setActiveWarehouse = useSessionStore((s) => s.setActiveWarehouse);
  const summary = useDashboardSummary();
  const startDelivery = useStartDelivery();
  const navigate = useNavigate();
  const firstName = user.name.split(" ")[0];
  const lowStock = summary.data?.lowStockCount ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="relative overflow-hidden rounded-b-[28px] bg-linear-135 from-primary-400 via-primary-500 to-primary-600 px-5 pb-20 pt-[calc(1.25rem+env(safe-area-inset-top))] text-white">
        {/* Circulos decorativos do legado */}
        <m.span
          aria-hidden="true"
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.08]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        />
        <m.span
          aria-hidden="true"
          className="absolute -bottom-16 right-8 h-24 w-24 rounded-full bg-white/[0.08]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
        />
        <div className="relative flex items-start justify-between">
          <m.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <h1 className="text-[19px] font-bold">
              Olá, {firstName}! <span aria-hidden="true">👋</span>
            </h1>
            {user.warehouses.length > 1 ? (
              <label className="relative mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-white/95">
                <span className="sr-only">Almoxarifado</span>
                <select
                  value={warehouse?.id ?? ""}
                  onChange={(e) => setActiveWarehouse(e.target.value)}
                  className="cursor-pointer appearance-none bg-transparent pr-5 font-medium focus:outline-none"
                >
                  {user.warehouses.map((w) => (
                    <option key={w.id} value={w.id} className="text-neutral-900">
                      {w.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-0 h-4 w-4"
                  aria-hidden="true"
                />
              </label>
            ) : (
              warehouse && (
                <p className="mt-1 text-[13px] font-medium text-white/95">{warehouse.name}</p>
              )
            )}
          </m.div>
          <Link
            to="/estoque?baixo=1"
            aria-label={
              lowStock > 0 ? `${lowStock} item(ns) com estoque abaixo do mínimo` : "Estoque"
            }
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.16]"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {lowStock > 0 && (
              <m.span
                aria-hidden="true"
                className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white ring-2 ring-primary-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
              />
            )}
          </Link>
        </div>
      </header>

      <div className="relative -mt-14 px-4">
        <Stagger className="grid grid-cols-2 gap-3" step={0.06}>
          <StaggerItem>
            <ActionCard
              icon={QrCode}
              line1="Escanear"
              line2="QR Code"
              onClick={() => {
                startDelivery();
                navigate("/entregas/nova/scanner");
              }}
            />
          </StaggerItem>
          <StaggerItem>
            <ActionCard
              icon={UserSearch}
              line1="Buscar"
              line2="Funcionário"
              onClick={startDelivery}
            />
          </StaggerItem>
        </Stagger>

        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3, ease: EASE }}
        >
          <Card className="mt-3.5 p-4">
            <h2 className="text-sm font-semibold text-neutral-900">Resumo de hoje</h2>
            {summary.isError ? (
              <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
            ) : (
              <dl className="mt-3 grid grid-cols-3 divide-x divide-neutral-100 text-center">
                {[
                  { label: "Entregas", value: summary.data?.today.deliveries, orange: true },
                  { label: "Funcionários", value: summary.data?.today.employeesServed },
                  { label: "Tipos de EPI", value: summary.data?.today.epiTypes },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col-reverse">
                    <dt className="mt-0.5 text-xs text-neutral-500">{item.label}</dt>
                    <dd
                      className={`font-display text-[26px] font-extrabold ${item.orange ? "text-primary-500" : "text-neutral-900"}`}
                    >
                      {item.value === undefined ? (
                        <span
                          className="skeleton mx-auto block h-8 w-10 rounded-lg"
                          aria-hidden="true"
                        />
                      ) : (
                        <CountUp value={item.value} />
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.3, ease: EASE }}
        >
          <Card className="mb-6 mt-3.5 overflow-hidden">
            <div className="flex items-center justify-between px-4 pb-1 pt-4">
              <h2 className="text-sm font-semibold text-neutral-900">Últimas entregas</h2>
              <Link to="/entregas" className="text-[13px] font-bold text-primary-700">
                Ver todas
              </Link>
            </div>
            {summary.isPending ? (
              <SkeletonList rows={3} label="Carregando últimas entregas..." />
            ) : summary.data && summary.data.recentDeliveries.length === 0 ? (
              <EmptyState
                title="Nenhuma entrega ainda"
                description="As entregas registradas aparecerão aqui."
              />
            ) : (
              <Stagger as="ul" className="divide-y divide-neutral-100" delay={0.2}>
                {summary.data?.recentDeliveries.map((d) => (
                  <StaggerItem as="li" key={d.id}>
                    <Link
                      to={`/entregas/${d.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
                    >
                      <Avatar name={d.employeeName} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-bold text-neutral-900">
                          {d.employeeName}
                        </span>
                        <span className="block text-xs text-neutral-500">
                          Matrícula: {d.employeeRegistration}
                        </span>
                      </span>
                      <time
                        dateTime={d.deliveredAt}
                        className="text-xs font-semibold text-neutral-500"
                      >
                        {formatShortWhen(d.deliveredAt)}
                      </time>
                    </Link>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </Card>
        </m.div>
      </div>
    </div>
  );
}
