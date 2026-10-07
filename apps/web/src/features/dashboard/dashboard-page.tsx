import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { DesktopHome } from "./desktop-home";
import { MobileHome } from "./mobile-home";

/**
 * Celular mantem a Home do legado; no computador o inicio vira um painel proprio
 * (mesma identidade, outro layout), para nao parecer uma tela de celular esticada.
 */
export function DashboardPage() {
  return useMediaQuery(DESKTOP_QUERY) ? <DesktopHome /> : <MobileHome />;
}
