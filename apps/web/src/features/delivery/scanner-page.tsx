import { Html5Qrcode } from "html5-qrcode";
import { Search, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../shared/components/ui/button";
import { Input } from "../../shared/components/ui/input";
import { MOCK_EMPLOYEE } from "./mock-data";
import { useDeliveryFlowStore } from "./store";

const SCANNER_ELEMENT_ID = "qr-scanner-viewport";

export function ScannerPage() {
  const navigate = useNavigate();
  const setEmployee = useDeliveryFlowStore((state) => state.setEmployee);
  const [cameraError, setCameraError] = useState(false);
  const [manualRegistration, setManualRegistration] = useState("");

  const goToEmployeeFound = () => {
    setEmployee(MOCK_EMPLOYEE);
    navigate("/entregas/nova/funcionario");
  };

  const goToEmployeeFoundRef = useRef(goToEmployeeFound);
  goToEmployeeFoundRef.current = goToEmployeeFound;

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        () => {
          if (!cancelled) goToEmployeeFoundRef.current();
        },
        undefined,
      )
      .catch(() => {
        if (!cancelled) setCameraError(true);
      });

    return () => {
      cancelled = true;
      Promise.resolve()
        .then(() => scanner.stop())
        .catch(() => undefined)
        .finally(() => {
          try {
            scanner.clear();
          } catch {
            // scanner was never rendered - nothing to clear
          }
        });
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-900 text-white">
      <header className="flex h-14 shrink-0 items-center justify-between px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Fechar"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">Escanear QR Code</h1>
        <button
          type="button"
          aria-label="Lanterna"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
        >
          <Zap className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-10">
        <p className="text-center text-sm text-neutral-300">Aponte a camera para o QR Code do cracha</p>

        <div className="relative h-64 w-64 max-w-full">
          <div id={SCANNER_ELEMENT_ID} className="h-full w-full overflow-hidden rounded-lg bg-black" />
          <span className="pointer-events-none absolute -left-1 -top-1 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-primary-500" />
          <span className="pointer-events-none absolute -right-1 -top-1 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-primary-500" />
          <span className="pointer-events-none absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-primary-500" />
          <span className="pointer-events-none absolute -bottom-1 -right-1 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-primary-500" />
        </div>

        <p className="text-center text-xs text-neutral-400">
          {cameraError
            ? "Nao foi possivel acessar a camera. Use a busca manual abaixo."
            : "Posicione o QR Code dentro do quadro"}
        </p>

        <div className="mt-4 w-full max-w-xs">
          <p className="mb-2 text-center text-xs text-neutral-400">ou busque manualmente</p>
          <div className="flex gap-2">
            <Input
              value={manualRegistration}
              onChange={(event) => setManualRegistration(event.target.value)}
              placeholder="Matricula"
              className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
            />
            <Button type="button" onClick={goToEmployeeFound} disabled={!manualRegistration} aria-label="Buscar">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
