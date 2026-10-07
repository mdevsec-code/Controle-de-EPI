import { useSyncExternalStore } from "react";

/** Mesmo ponto de quebra do Tailwind `lg` (sidebar de desktop). */
export const DESKTOP_QUERY = "(min-width: 1024px)";

/** true enquanto a media query casar; atualiza ao redimensionar/girar a tela. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
