import { History, Home, PackagePlus } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/entregas/nova", label: "Nova entrega", icon: PackagePlus, end: false },
  { to: "/entregas/historico", label: "Historico", icon: History, end: false },
] as const;
