import { Printer } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/controls";
import { ErrorState, Spinner } from "@/components/ui/feedback";
import { formatDate, formatDateTime, formatDeliveryNumber } from "@/lib/format";
import { DELIVERY_REASON_LABEL } from "@/lib/labels";
import { useDelivery, useSignatureImage } from "./api";

/** Comprovante de entrega (ficha de EPI) em formato imprimivel / "Salvar como PDF". */
export function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const delivery = useDelivery(id);
  const signatureUrl = useSignatureImage(id);

  if (delivery.isPending) return <Spinner />;
  if (delivery.isError)
    return <ErrorState error={delivery.error} onRetry={() => void delivery.refetch()} />;
  const d = delivery.data;

  return (
    <div className="min-h-dvh bg-neutral-100 px-4 py-6 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-2">
        <Link
          to={`/entregas/${d.id}`}
          className="text-sm font-semibold text-primary-700 underline underline-offset-4"
        >
          Voltar à entrega
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Imprimir / salvar PDF
        </Button>
      </div>

      <article className="mx-auto max-w-3xl bg-white p-8 text-sm text-neutral-900 shadow-sm print:max-w-none print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
          <Logo className="w-48" />
          <div className="text-right">
            <h1 className="text-lg font-bold">Comprovante de entrega de EPI</h1>
            <p className="text-neutral-600">{formatDeliveryNumber(d.number)}</p>
            <p className="text-neutral-600">{formatDateTime(d.deliveredAt)}</p>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1">
          <p>
            <strong>Colaborador:</strong> {d.employee.name}
          </p>
          <p>
            <strong>Matrícula:</strong> {d.employee.registration}
          </p>
          <p>
            <strong>Função:</strong> {d.employee.jobRoleName}
          </p>
          <p>
            <strong>Empresa:</strong> {d.employee.companyName}
          </p>
          <p>
            <strong>Motivo:</strong> {DELIVERY_REASON_LABEL[d.reason]}
            {d.reasonDetail ? ` — ${d.reasonDetail}` : ""}
          </p>
          <p>
            <strong>Responsável:</strong> {d.deliveredBy.name} ({d.warehouse.name})
          </p>
        </section>

        <table className="mt-5 w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-neutral-300">
              <th className="py-2 pr-2">EPI</th>
              <th className="py-2 pr-2">CA</th>
              <th className="py-2 pr-2">Tam./Lote</th>
              <th className="py-2 pr-2 text-right">Qtd.</th>
              <th className="py-2">Troca prevista</th>
            </tr>
          </thead>
          <tbody>
            {d.items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-200">
                <td className="py-2 pr-2">{item.epiName}</td>
                <td className="py-2 pr-2">{item.caNumber}</td>
                <td className="py-2 pr-2">
                  {[item.size, item.batchNumber].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className="py-2 pr-2 text-right">{item.quantity}</td>
                <td className="py-2">
                  {item.expectedReplacementAt ? formatDate(item.expectedReplacementAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-5 text-xs leading-relaxed text-neutral-700">
          Declaro ter recebido gratuitamente os Equipamentos de Proteção Individual acima, em
          perfeito estado, e ter sido orientado(a) sobre seu uso correto, guarda e conservação,
          comprometendo-me a utilizá-los conforme a NR-6 e a comunicar qualquer alteração que os
          torne impróprios para uso.
        </p>

        <section className="mt-6 flex flex-col items-center">
          <div className="flex h-28 w-72 items-end justify-center border-b border-neutral-400">
            {signatureUrl && (
              <img
                src={signatureUrl}
                alt={`Assinatura de ${d.employee.name}`}
                className="max-h-24 object-contain"
              />
            )}
          </div>
          <p className="mt-1 font-semibold">{d.employee.name}</p>
          {d.signature && (
            <p className="mt-2 max-w-full break-all text-center text-[10px] text-neutral-500">
              Assinatura eletrônica em {formatDateTime(d.signature.signedAt)} · Código de
              verificação (SHA-256): {d.signature.contentHash}
            </p>
          )}
        </section>
      </article>
    </div>
  );
}
