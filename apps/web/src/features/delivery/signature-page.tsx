import { Check, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { FocusHeader } from "../../app/layout/focus-header";
import { Button } from "../../shared/components/ui/button";
import { useDeliveryFlowStore } from "./store";

export function SignaturePage() {
  const navigate = useNavigate();
  const employee = useDeliveryFlowStore((state) => state.employee);
  const setSignature = useDeliveryFlowStore((state) => state.setSignature);
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  if (!employee) {
    return <Navigate to="/entregas/nova" replace />;
  }

  const handleClear = () => {
    signatureRef.current?.clear();
    setIsEmpty(true);
  };

  const handleConfirm = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) return;
    setSignature(signatureRef.current.toDataURL("image/png"));
    navigate("/entregas/nova/sucesso");
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <FocusHeader title="Assinatura" />

      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6">
        <p className="text-center text-base font-semibold text-neutral-900 dark:text-neutral-50">
          {employee.name}
        </p>
        <p className="mt-1 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Assine abaixo para confirmar o recebimento
        </p>

        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700">
          <SignatureCanvas
            ref={signatureRef}
            penColor="#0f172a"
            canvasProps={{ className: "h-64 w-full touch-none" }}
            onEnd={() => setIsEmpty(Boolean(signatureRef.current?.isEmpty()))}
          />
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="mx-auto mt-4 flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          <RotateCcw className="h-4 w-4" />
          Limpar
        </button>
      </div>

      <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4 sm:px-6 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mx-auto max-w-xl">
          <Button fullWidth size="lg" disabled={isEmpty} onClick={handleConfirm}>
            Confirmar assinatura
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
