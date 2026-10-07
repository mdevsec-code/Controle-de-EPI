import { KeyRound, LogOut, PackagePlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Stagger, StaggerItem } from "@/components/motion/primitives";
import { Logo } from "@/components/ui/controls";
import { useLogout } from "@/features/auth/auth-api";
import { useSessionStore } from "@/features/auth/session-store";
import { useStartDelivery } from "@/features/deliveries/flow/use-flow";
import { ROLE_LABEL } from "@/lib/labels";
import { navItemsFor } from "./navigation";

const row =
  "flex min-h-12 w-full items-center gap-3.5 rounded-xl px-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50";
const icon = "h-[19px] w-[19px] shrink-0 text-neutral-600";

/** Menu do celular (mesmo layout do drawer do legado: logo, itens com icone, Sair em laranja). */
export function MenuPage() {
  const user = useSessionStore((s) => s.user);
  const logout = useLogout();
  const startDelivery = useStartDelivery();

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-md flex-col bg-white">
      <div className="border-b border-neutral-100 px-6 pb-5 pt-[calc(1.75rem+env(safe-area-inset-top))]">
        <Logo className="w-48" />
        <p className="mt-3 text-xs text-neutral-500">
          <span className="font-bold text-neutral-900">{user?.name}</span> ·{" "}
          {user && ROLE_LABEL[user.role]}
        </p>
      </div>

      <Stagger as="ul" className="flex-1 space-y-0.5 px-3 py-2.5">
        <StaggerItem as="li">
          <button type="button" onClick={startDelivery} className={row}>
            <PackagePlus className={icon} aria-hidden="true" />
            Nova entrega
          </button>
        </StaggerItem>
        {navItemsFor(user?.role).map((item) => (
          <StaggerItem as="li" key={item.to}>
            <Link to={item.to} className={row}>
              <item.icon className={icon} aria-hidden="true" />
              {item.label}
            </Link>
          </StaggerItem>
        ))}
        <StaggerItem as="li">
          <Link to="/conta/senha" className={row}>
            <KeyRound className={icon} aria-hidden="true" />
            Alterar senha
          </Link>
        </StaggerItem>
        <StaggerItem as="li" className="pt-1.5">
          <button
            type="button"
            onClick={() => void logout()}
            className={`${row} font-bold text-primary-700`}
          >
            <LogOut className="h-[19px] w-[19px] shrink-0 text-primary-500" aria-hidden="true" />
            Sair
          </button>
        </StaggerItem>
      </Stagger>
      <p className="border-t border-neutral-100 p-3.5 text-center text-[11px] text-neutral-500">
        Versão {__APP_VERSION__}
      </p>
    </div>
  );
}
