import {
  RETURN_CONDITIONS,
  type DeliveryItemDto,
  type ReturnCondition,
} from "@epi-manager/contracts";
import { ArrowLeft, FileText, Fingerprint, Undo2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Stagger, StaggerItem } from "@/components/motion/primitives";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { QuantityStepper } from "@/components/ui/controls";
import { ErrorState, InlineError, Spinner } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { Avatar, Badge, Card, DetailRow, PageHeader, SectionHead } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast-store";
import { epiIcon } from "@/lib/epi-icons";
import { formatDate, formatDateTime, formatDeliveryNumber } from "@/lib/format";
import {
  DELIVERY_REASON_LABEL,
  DELIVERY_STATUS_LABEL,
  RETURN_CONDITION_LABEL,
  sizeLabel,
} from "@/lib/labels";
import { EASE } from "@/lib/motion";
import { useDelivery, useRegisterReturn, useSignatureImage } from "./api";

function ReturnForm({
  deliveryId,
  item,
  onDone,
}: {
  deliveryId: string;
  item: DeliveryItemDto;
  onDone: () => void;
}) {
  const pending = item.quantity - item.returnedQuantity;
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<ReturnCondition>("BOM");
  const [reason, setReason] = useState("");
  const register = useRegisterReturn(deliveryId);

  return (
    <m.form
      className="overflow-hidden"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      onSubmit={(e) => {
        e.preventDefault();
        register.mutate(
          { deliveryItemId: item.id, quantity, condition, reason: reason || undefined },
          {
            onSuccess: (result) => {
              toast.success(
                result.restocked
                  ? "Devolução registrada e estoque atualizado."
                  : "Devolução registrada.",
              );
              onDone();
            },
          },
        );
      }}
    >
      <div className="space-y-4 border-t border-neutral-100 bg-neutral-50 p-4">
        <p className="text-[13px] font-bold text-neutral-600">
          Registrar devolução · pendente {pending}
        </p>
        <QuantityStepper
          label="Quantidade devolvida"
          value={quantity}
          max={pending}
          onChange={setQuantity}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Condição">
            <Select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ReturnCondition)}
            >
              {RETURN_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {RETURN_CONDITION_LABEL[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Motivo (opcional)">
            <Input value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <InlineError error={register.error} />
        <div className="flex gap-2">
          <Button type="submit" loading={register.isPending}>
            Registrar devolução
          </Button>
          <Button variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </div>
    </m.form>
  );
}

export function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const delivery = useDelivery(id);
  const signatureUrl = useSignatureImage(id);
  const [returning, setReturning] = useState<string | null>(null);

  if (delivery.isPending) return <Spinner />;
  if (delivery.isError)
    return <ErrorState error={delivery.error} onRetry={() => void delivery.refetch()} />;
  const d = delivery.data;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:px-8 lg:py-10">
      <Link
        to="/entregas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Histórico
      </Link>
      <PageHeader
        title={`Entrega ${formatDeliveryNumber(d.number)}`}
        description={formatDateTime(d.deliveredAt)}
        actions={
          <Link
            to={`/entregas/${d.id}/comprovante`}
            className={buttonVariants({ variant: "outline", size: "md" })}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Comprovante
          </Link>
        }
      />

      <Stagger className="grid gap-4 lg:grid-cols-[1.1fr_1fr]" step={0.05}>
        <StaggerItem>
          <Card className="h-full overflow-hidden">
            <div className="flex items-center gap-3 border-b border-neutral-100 p-4">
              <Avatar name={d.employee.name} className="h-12 w-12" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-bold text-neutral-900">{d.employee.name}</p>
                <p className="text-xs text-neutral-500">Matrícula {d.employee.registration}</p>
              </div>
              <Badge tone={d.status === "CONCLUIDA" ? "success" : "neutral"}>
                {DELIVERY_STATUS_LABEL[d.status]}
              </Badge>
            </div>
            <dl className="divide-y divide-neutral-100">
              <DetailRow label="Função">{d.employee.jobRoleName}</DetailRow>
              <DetailRow label="Motivo">
                {DELIVERY_REASON_LABEL[d.reason]}
                {d.reasonDetail && (
                  <span className="block text-xs font-normal">{d.reasonDetail}</span>
                )}
              </DetailRow>
              <DetailRow label="Responsável">{d.deliveredBy.name}</DetailRow>
              <DetailRow label="Almoxarifado">{d.warehouse.name}</DetailRow>
            </dl>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="h-full p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[14.5px] font-bold text-neutral-900">
                Assinatura do colaborador
              </h2>
              <Fingerprint className="h-5 w-5 text-primary-500" aria-hidden="true" />
            </div>
            <div className="mt-3 flex h-36 items-center justify-center rounded-[14px] border-[1.5px] border-neutral-100 bg-white">
              {signatureUrl ? (
                <m.img
                  src={signatureUrl}
                  alt={`Assinatura de ${d.employee.name}`}
                  className="max-h-full max-w-full object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: EASE }}
                />
              ) : (
                <span className="text-sm text-neutral-500">Carregando assinatura...</span>
              )}
            </div>
            {d.signature && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-neutral-500">
                  Assinada em {formatDateTime(d.signature.signedAt)}
                </p>
                <p className="break-all font-mono text-[10px] leading-relaxed text-neutral-400">
                  SHA-256 · {d.signature.contentHash}
                </p>
              </div>
            )}
          </Card>
        </StaggerItem>
      </Stagger>

      <SectionHead title="Itens entregues" />
      <Card className="overflow-hidden">
        <ul className="divide-y divide-neutral-100">
          {d.items.map((item) => {
            const pending = item.quantity - item.returnedQuantity;
            const Icon = epiIcon("", item.epiName);
            return (
              <li key={item.id}>
                <div className="flex flex-wrap items-center gap-3 px-4 py-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-150 text-primary-500">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900">
                      {[item.epiName, sizeLabel(item.size)].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-sm text-neutral-500">
                      <span className="font-mono">CA {item.caNumber}</span> · {item.quantity} un.
                      {item.returnedQuantity > 0 && ` · ${item.returnedQuantity} devolvida(s)`}
                      {item.expectedReplacementAt &&
                        ` · Troca prevista ${formatDate(item.expectedReplacementAt)}`}
                    </p>
                    {item.notes && (
                      <p className="mt-1 text-sm text-neutral-700">Obs.: {item.notes}</p>
                    )}
                  </div>
                  {pending > 0 && returning !== item.id && (
                    <Button variant="outline" size="sm" onClick={() => setReturning(item.id)}>
                      <Undo2 className="h-4 w-4" aria-hidden="true" />
                      Devolução
                    </Button>
                  )}
                </div>
                <AnimatePresence initial={false}>
                  {returning === item.id && (
                    <ReturnForm
                      key="form"
                      deliveryId={d.id}
                      item={item}
                      onDone={() => setReturning(null)}
                    />
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
