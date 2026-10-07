import { ClipboardList, Home, KeyRound, LogOut, Menu, PackagePlus } from "lucide-react";
import * as m from "motion/react-m";
import { Suspense } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatedOutlet } from "@/components/motion/animated-outlet";
import { Logo } from "@/components/ui/controls";
import { Spinner } from "@/components/ui/feedback";
import { useLogout } from "@/features/auth/auth-api";
import { useSessionStore } from "@/features/auth/session-store";
import { useStartDelivery } from "@/features/deliveries/flow/use-flow";
import { cn } from "@/lib/cn";
import { ROLE_LABEL } from "@/lib/labels";
import { SPRING_SNAPPY } from "@/lib/motion";
import { navItemsFor } from "./navigation";

function isActive(pathname: string, to: string, end?: boolean) {
  return end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
}

/** Sidebar do desktop no estilo do menu (drawer) do legado. */
function Sidebar() {
  const user = useSessionStore((s) => s.user);
  const { pathname } = useLocation();
  const logout = useLogout();
  const startDelivery = useStartDelivery();

  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-neutral-100 bg-white lg:flex">
      <div className="border-b border-neutral-100 px-6 py-5">
        <Logo className="w-52" />
      </div>
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={startDelivery}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-linear-135 from-primary-400 to-primary-500 font-display text-sm font-bold uppercase tracking-[0.04em] text-white shadow-(--shadow-cta) transition-transform duration-150 active:scale-[0.98]"
        >
          <PackagePlus className="h-5 w-5" aria-hidden="true" />
          Nova entrega
        </button>
      </div>
      <nav aria-label="Principal" className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-3">
        {navItemsFor(user?.role).map((item) => {
          const active = isActive(pathname, item.to, item.end);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={cn(
                "relative flex min-h-12 items-center gap-3.5 rounded-xl px-3 text-sm font-semibold transition-colors duration-150",
                active ? "text-primary-700" : "text-neutral-900 hover:bg-neutral-50",
              )}
            >
              {active && (
                <m.span
                  layoutId="sidebar-active"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl bg-primary-100"
                  transition={SPRING_SNAPPY}
                />
              )}
              <item.icon
                className={cn(
                  "relative h-[19px] w-[19px]",
                  active ? "text-primary-500" : "text-neutral-600",
                )}
                aria-hidden="true"
              />
              <span className="relative">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="space-y-0.5 border-t border-neutral-100 p-3">
        <p className="px-3 pb-2 pt-1 text-xs text-neutral-500">
          <span className="block text-sm font-bold text-neutral-900">{user?.name}</span>
          {user && ROLE_LABEL[user.role]}
        </p>
        <NavLink
          to="/conta/senha"
          className="flex min-h-11 items-center gap-3.5 rounded-xl px-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
        >
          <KeyRound className="h-[19px] w-[19px] text-neutral-600" aria-hidden="true" />
          Alterar senha
        </NavLink>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex min-h-11 w-full items-center gap-3.5 rounded-xl px-3 text-sm font-bold text-primary-700 transition-colors hover:bg-primary-50"
        >
          <LogOut className="h-[19px] w-[19px] text-primary-500" aria-hidden="true" />
          Sair
        </button>
      </div>
    </aside>
  );
}

/** Barra inferior do legado: Início, Entregas, Histórico e Menu; ativo em laranja. */
function BottomNav() {
  const { pathname } = useLocation();
  const startDelivery = useStartDelivery();
  const item =
    "relative flex flex-1 flex-col items-center gap-[3px] rounded-xl px-0.5 py-1.5 text-[10.5px] font-semibold transition-colors duration-150";

  const icon = (Icon: typeof Home, active: boolean) => (
    <span className="relative flex h-[22px] w-8 items-center justify-center">
      {active && (
        <m.span
          layoutId="bottom-active"
          aria-hidden="true"
          className="absolute inset-0 rounded-[10px] bg-primary-100"
          transition={SPRING_SNAPPY}
        />
      )}
      <Icon className="relative h-5 w-5" aria-hidden="true" />
    </span>
  );

  const links = [
    { to: "/", label: "Início", icon: Home, end: true },
    { to: "/entregas", label: "Histórico", icon: ClipboardList },
    { to: "/menu", label: "Menu", icon: Menu },
  ] as const;
  const [home, history, menu] = links;

  const link = (l: (typeof links)[number]) => {
    const active = isActive(pathname, l.to, "end" in l ? l.end : undefined);
    return (
      <NavLink
        key={l.to}
        to={l.to}
        end={"end" in l ? l.end : undefined}
        className={cn(item, active ? "text-primary-500" : "text-neutral-500")}
      >
        {icon(l.icon, active)}
        {l.label}
      </NavLink>
    );
  };

  return (
    <nav
      aria-label="Principal"
      className="no-print fixed inset-x-0 bottom-0 z-30 flex border-t border-neutral-100 bg-white px-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 lg:hidden"
    >
      {link(home)}
      <button type="button" onClick={startDelivery} className={cn(item, "text-neutral-500")}>
        {icon(PackagePlus, false)}
        Entregas
      </button>
      {link(history)}
      {link(menu)}
    </nav>
  );
}

export function AppShell() {
  return (
    <div className="min-h-dvh bg-neutral-50 lg:flex">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Pular para o conteúdo
      </a>
      <Sidebar />
      <main id="conteudo" className="min-w-0 flex-1 pb-24 lg:pb-0">
        <Suspense fallback={<Spinner />}>
          <AnimatedOutlet />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
