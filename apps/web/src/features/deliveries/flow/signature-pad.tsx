import { RotateCcw } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState } from "react";
import SignatureCanvasModule from "react-signature-canvas";
import { cjsDefault } from "@/lib/cjs-interop";
import { cn } from "@/lib/cn";

const SignatureCanvas = cjsDefault(SignatureCanvasModule);

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

/**
 * Area de assinatura (caixa branca com borda do legado). O canvas acompanha o tamanho real
 * do elemento (x devicePixelRatio) para o traco nao ficar deslocado nem borrado em celulares.
 */
export function SignaturePad({ onChange, disabled }: SignaturePadProps) {
  const padRef = useRef<SignatureCanvasModule>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(true);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const resize = () => {
      const canvas = padRef.current?.getCanvas();
      if (!canvas) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = wrapper.clientWidth * ratio;
      canvas.height = wrapper.clientHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      // Redimensionar apaga o desenho: exige assinar de novo para nao gravar algo cortado.
      padRef.current?.clear();
      setEmpty(true);
      onChange(null);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [onChange]);

  useEffect(() => {
    if (disabled) padRef.current?.off();
    else padRef.current?.on();
  }, [disabled]);

  const clear = () => {
    padRef.current?.clear();
    setEmpty(true);
    onChange(null);
  };

  return (
    <div>
      <div
        ref={wrapperRef}
        className={cn(
          "relative h-[260px] overflow-hidden rounded-[18px] border-[1.5px] bg-white transition-colors duration-200",
          drawing ? "border-primary-400" : "border-neutral-100",
        )}
      >
        <SignatureCanvas
          ref={padRef}
          penColor="#1b1b1f"
          minWidth={1.2}
          maxWidth={3}
          canvasProps={{
            className: "absolute inset-0 h-full w-full touch-none",
            "aria-label": "Área de assinatura. Assine com o dedo ou a caneta.",
            role: "img",
          }}
          onBegin={() => setDrawing(true)}
          onEnd={() => {
            setDrawing(false);
            const pad = padRef.current;
            if (!pad || pad.isEmpty()) return;
            setEmpty(false);
            onChange(pad.getCanvas().toDataURL("image/png"));
          }}
        />
        <AnimatePresence>
          {empty && !drawing && (
            <m.p
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-neutral-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              Assine aqui
            </m.p>
          )}
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={clear}
        disabled={disabled || empty}
        className="mx-auto mt-3 flex min-h-11 items-center gap-2 rounded-full px-5 text-[13px] font-semibold uppercase tracking-[0.04em] text-neutral-600 transition-colors duration-150 hover:bg-neutral-100 disabled:opacity-40"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Limpar
      </button>
    </div>
  );
}
