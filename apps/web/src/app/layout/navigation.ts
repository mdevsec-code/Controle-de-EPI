import type { UserRole } from "@epi-manager/contracts";
import {
  ClipboardList,
  Home,
  PackageSearch,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  end?: boolean;
}

/** Fonte unica da navegacao (sidebar, menu e bottom nav), filtrada pelo perfil. */
export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Início", icon: Home, roles: ["ADMIN", "ALMOXARIFADO"], end: true },
  {
    to: "/entregas",
    label: "Histórico de entregas",
    icon: ClipboardList,
    roles: ["ADMIN", "ALMOXARIFADO"],
  },
  { to: "/estoque", label: "Estoque", icon: PackageSearch, roles: ["ADMIN", "ALMOXARIFADO"] },
  { to: "/epis", label: "EPIs", icon: ShieldCheck, roles: ["ADMIN", "ALMOXARIFADO"] },
  { to: "/colaboradores", label: "Colaboradores", icon: Users, roles: ["ADMIN", "ALMOXARIFADO"] },
  { to: "/usuarios", label: "Usuários", icon: UserCog, roles: ["ADMIN"] },
];

export const navItemsFor = (role: UserRole | undefined) =>
  NAV_ITEMS.filter((item) => role !== undefined && item.roles.includes(role));
