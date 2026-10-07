import { Check, Loader2, X, Zap } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchEmployeeByBadge } from "@/features/employees/api";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { EASE } from "@/lib/motion";
import { useDeliveryDraft } from "../draft";

const VIEWPORT_ID = "qr-viewport";

type ScanState =
  | { kind: "starting" }
  | { kind: "scanning" }
  | { kind: "resolving" }
  | { kind: "found"; name: string }
  | { kind: "error"; message: string };

const CORNERS = [
  "left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl",
  "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl",
  "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
  "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
];

/**
 * Leitura do QR do cracha. O QR contem so um codigo opaco; quem resolve o colaborador
 * (e decide se o usuario pode ve-lo) e a API.
 */
export function ScannerPage() {
  const navigate = useNavigate();
  const setEmployee = useDeliveryDraft((s) => s.setEmployee);
  const [state, setState] = useState<ScanState>({ kind: "starting" });
  const [torch, setTorch] = useState<{ supported: boolean; on: boolean }>({
    supported: false,
    on: false,
  });
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function onDecoded(code: string) {
      if (busyRef.current) return;
      busyRef.current = true;
      setState({ kind: "resolving" });
      try {
        const employee = await fetchEmployeeByBadge(code.trim());
        if (cancelled) return;
        setEmployee(employee);
        setState({ kind: "found", name: employee.name });
        // Deixa o "flash" de confirmacao aparecer antes de seguir.
        setTimeout(() => {
          if (!cancelled) navigate("/entregas/nova/colaborador", { replace: true });
        }, 650);
      } catch (error) {
        if (cancelled) return;
        setState({ kind: "error", message: errorMessage(error) });
        setTimeout(() => {
          busyRef.current = false;
          if (!cancelled) setState({ kind: "scanning" });
        }, 2500);
      }
    }

    // Biblioteca pesada: carregada so nesta tela.
    void import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(VIEWPORT_ID, { verbose: false });
      scannerRef.current = scanner;
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => void onDecoded(text),
          undefined,
        )
        .then(() => {
          if (cancelled) return;
          setState({ kind: "scanning" });
          try {
            const capabilities = scanner.getRunningTrackCapabilities() as MediaTrackCapabilities & {
              torch?: boolean;
            };
            setTorch({ supported: Boolean(capabilities.torch), on: false });
          } catch {
            // dispositivo sem informacao de lanterna
          }
        })
        .catch(() => {
          if (!cancelled) {
            setState({
              kind: "error",
              message:
                "Não foi possível acessar a câmera. Permita o acesso ou busque o colaborador pelo nome.",
            });
          }
        });
    });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner?.isScanning) {
        void scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => undefined);
      }
    };
  }, [navigate, setEmployee]);

  const toggleTorch = async () => {
    const next = !torch.on;
    try {
      await scannerRef.current?.applyVideoConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorch({ supported: true, on: next });
    } catch {
      setTorch({ supported: false, on: false });
    }
  };

  const tone =
    state.kind === "found"
      ? "border-success-600"
      : state.kind === "error"
        ? "border-danger-500"
        : "border-primary-400";

  return (
    <div className="flex min-h-dvh bg-neutral-900 flex-col text-white">
      <header className="flex h-16 items-center justify-between px-2 pt-[env(safe-area-inset-top)]">
        <Link
          to="/entregas/nova"
          aria-label="Fechar leitor"
          className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/10"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </Link>
        <h1 className="font-display text-base font-bold">Escanear QR Code</h1>
        {torch.supported ? (
          <button
            type="button"
            onClick={() => void toggleTorch()}
            aria-label={torch.on ? "Desligar lanterna" : "Ligar lanterna"}
            aria-pressed={torch.on}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
              torch.on ? "bg-primary-500 text-white" : "hover:bg-white/10",
            )}
          >
            <Zap className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : (
          <span className="w-11" aria-hidden="true" />
        )}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-7 px-6 pb-10">
        <m.p
          className="text-center text-sm text-neutral-300"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          Aponte a câmera para o QR Code do crachá
        </m.p>

        <m.div
          className="relative aspect-square w-full max-w-72"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <div id={VIEWPORT_ID} className="h-full w-full overflow-hidden rounded-2xl bg-black/60" />
          {/* Cantoneiras que "respiram" enquanto procura */}
          {CORNERS.map((pos, i) => (
            <m.span
              key={pos}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute h-12 w-12 transition-colors duration-300",
                tone,
                pos,
              )}
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE, delay: 0.1 + i * 0.04 }}
            />
          ))}
          {/* Laser */}
          {state.kind === "scanning" && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-6 h-0.5 animate-scan rounded-full bg-primary-400 shadow-[0_0_12px_2px_rgb(255_138_61/0.55)] [--scan-distance:236px]"
            />
          )}
          <AnimatePresence>
            {state.kind === "resolving" && (
              <m.div
                key="resolving"
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-neutral-900/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-9 w-9 animate-spin text-primary-400" aria-hidden="true" />
              </m.div>
            )}
            {state.kind === "found" && (
              <m.div
                key="found"
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-success-600/85"
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <m.span
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-success-700"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
                >
                  <Check className="h-10 w-10" strokeWidth={3} aria-hidden="true" />
                </m.span>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>

        <p
          role="status"
          aria-live="polite"
          className="min-h-12 max-w-xs text-center text-sm text-neutral-300"
        >
          {state.kind === "starting" && "Abrindo a câmera..."}
          {state.kind === "scanning" && "Posicione o QR Code dentro do quadro"}
          {state.kind === "resolving" && "Identificando colaborador..."}
          {state.kind === "found" && (
            <span className="font-semibold text-white">{state.name} identificado</span>
          )}
          {state.kind === "error" && (
            <span className="font-semibold text-primary-300">{state.message}</span>
          )}
        </p>

        <Link
          to="/entregas/nova"
          className="rounded-full px-5 py-3 text-sm font-semibold text-primary-400 transition-colors hover:bg-white/10"
        >
          Buscar pelo nome ou matrícula
        </Link>
      </main>
    </div>
  );
}
