import {
  BarChart3,
  ClipboardList,
  Home,
  LogOut,
  PackagePlus,
  Settings,
  ShieldCheck,
  Users,
  Warehouse,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../shared/components/ui/badge";

const ACTIVE_ITEMS = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/entregas/nova", label: "Nova entrega", icon: PackagePlus },
  { to: "/entregas/historico", label: "Historico de entregas", icon: ClipboardList },
];

const UPCOMING_ITEMS = [
  { label: "Funcionarios", icon: Users },
  { label: "EPIs", icon: ShieldCheck },
  { label: "Relatorios", icon: ClipboardList },
  { label: "Estatisticas", icon: BarChart3 },
  { label: "Almoxarifados", icon: Warehouse },
  { label: "Configuracoes", icon: Settings },
];

export function MenuPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
      <nav className="divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:divide-neutral-700 dark:border-neutral-700 dark:bg-neutral-800">
        {ACTIVE_ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-700"
          >
            <item.icon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            {item.label}
          </Link>
        ))}

        {UPCOMING_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-neutral-400 dark:text-neutral-500"
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.label}</span>
            <Badge variant="neutral">em breve</Badge>
          </div>
        ))}

        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </nav>

      <p className="mt-6 text-center text-xs text-neutral-400">Versao 1.0.0</p>
    </div>
  );
}
