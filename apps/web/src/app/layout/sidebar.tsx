import { LogOut, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../shared/lib/cn";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:flex lg:flex-col dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6 dark:border-neutral-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <span className="font-semibold text-neutral-900 dark:text-neutral-50">EPI Manager</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-neutral-200 p-3 dark:border-neutral-700">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 dark:hover:bg-danger-500/10"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
