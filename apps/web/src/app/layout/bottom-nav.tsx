import { Menu as MenuIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../shared/lib/cn";
import { NAV_ITEMS } from "./nav-items";

const MOBILE_ITEMS = [...NAV_ITEMS, { to: "/menu", label: "Menu", icon: MenuIcon, end: false }];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-neutral-700 dark:bg-neutral-800">
      {MOBILE_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
              isActive ? "text-primary-600" : "text-neutral-500 dark:text-neutral-400",
            )
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
