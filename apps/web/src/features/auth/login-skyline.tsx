import * as m from "motion/react-m";
import { EASE } from "@/lib/motion";

/**
 * Horizonte de obra no rodape do login (predios, torres e grua em cinza claro), como na
 * captura do legado. Sobe e aparece devagar; puramente decorativo.
 */
export function LoginSkyline() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative mt-auto h-28 overflow-hidden bg-linear-to-t from-primary-500/[0.07] to-transparent"
    >
      <m.svg
        viewBox="0 0 400 110"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-full w-full text-neutral-300"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 0.55, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
      >
        <g fill="currentColor">
          <rect x="0" y="70" width="34" height="40" />
          <rect x="8" y="58" width="16" height="12" />
          <rect x="40" y="48" width="22" height="62" />
          <path d="M51 30l4 18h-8z" />
          <rect x="68" y="78" width="30" height="32" />
          <rect x="104" y="60" width="18" height="50" />
          <rect x="108" y="40" width="10" height="20" />
          <path d="M113 22l3 18h-6z" />
          <rect x="128" y="74" width="40" height="36" />
          <rect x="174" y="52" width="26" height="58" />
          <rect x="206" y="82" width="34" height="28" />
          <rect x="246" y="64" width="20" height="46" />
          <rect x="272" y="76" width="36" height="34" />
          <rect x="314" y="58" width="24" height="52" />
          <rect x="344" y="72" width="56" height="38" />
        </g>
        {/* Grua */}
        <g stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M330 110V20M336 110V20" />
          <path d="M330 30l6-8M330 46l6-8M330 62l6-8M330 78l6-8M330 94l6-8" strokeWidth="1.2" />
          <path d="M280 24h110M333 12v12" />
          <path d="M333 12L292 24M333 12l50 12" strokeWidth="1.2" />
          <path d="M300 24v26" strokeWidth="1.2" />
        </g>
        <rect x="372" y="24" width="14" height="8" fill="currentColor" />
      </m.svg>
    </div>
  );
}
