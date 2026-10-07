import { STOCK_LOCATION_MAX_LENGTH, type StockItemDto } from "@epi-manager/contracts";
import { MapPin } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast-store";
import { useEpis } from "@/features/epis/api";
import { fieldErrors } from "@/lib/errors";
import { sizeLabel } from "@/lib/labels";
import { useStockAdjustment, useStockEntry, useStockLocations } from "./api";

/** Entrada de material: o saldo e somado no servidor, com movimentacao ENTRADA. */
export function StockEntryForm({
  warehouseId,
  onDone,
}: {
  warehouseId: string;
  onDone: () => void;
}) {
  const epis = useEpis({ active: true, pageSize: 100 });
  const locations = useStockLocations(warehouseId);
  const listId = useId();
  const entry = useStockEntry();
  const [form, setForm] = useState({
    epiItemId: "",
    size: "",
    batchNumber: "",
    quantity: "",
    reason: "",
    location: "",
  });
  const errors = fieldErrors(entry.error);
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    entry.mutate(
      {
        warehouseId,
        epiItemId: form.epiItemId,
        size: form.size,
        batchNumber: form.batchNumber,
        quantity: Number(form.quantity),
        reason: form.reason || undefined,
        // Vazio = mantem o local que o item ja tem.
        location: form.location.trim() || undefined,
      },
      {
        onSuccess: (item) => {
          toast.success(`Entrada registrada. Saldo de ${item.epiName}: ${item.quantity}.`);
          onDone();
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="EPI" required error={errors.epiItemId}>
        <Select value={form.epiItemId} onChange={(e) => set("epiItemId")(e.target.value)}>
          <option value="">{epis.isPending ? "Carregando..." : "Selecione"}</option>
          {epis.data?.items.map((epi) => (
            <option key={epi.id} value={epi.id}>
              {epi.name} ({epi.internalCode})
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tamanho" hint="Vazio se não tiver grade" error={errors.size}>
          <Input value={form.size} maxLength={10} onChange={(e) => set("size")(e.target.value)} />
        </Field>
        <Field label="Lote" hint="Opcional" error={errors.batchNumber}>
          <Input
            value={form.batchNumber}
            maxLength={40}
            onChange={(e) => set("batchNumber")(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Quantidade recebida" required error={errors.quantity}>
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          value={form.quantity}
          onChange={(e) => set("quantity")(e.target.value)}
        />
      </Field>
      <Field
        label="Local de armazenamento"
        hint="Vazio mantém o local atual"
        error={errors.location}
      >
        <Input
          value={form.location}
          list={listId}
          maxLength={STOCK_LOCATION_MAX_LENGTH}
          placeholder="Ex.: Corredor A · Prateleira 2"
          icon={<MapPin className="h-4.5 w-4.5" />}
          onChange={(e) => set("location")(e.target.value)}
        />
      </Field>
      <datalist id={listId}>
        {locations.data?.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <Field label="Documento / observação" hint="Ex.: NF 1234" error={errors.reason}>
        <Input
          value={form.reason}
          maxLength={200}
          onChange={(e) => set("reason")(e.target.value)}
        />
      </Field>
      <InlineError error={Object.keys(errors).length ? null : entry.error} />
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={entry.isPending}
        disabled={!form.epiItemId || !form.quantity}
      >
        Registrar entrada
      </Button>
    </form>
  );
}

type AdjustType = "AJUSTE" | "PERDA" | "AVARIA" | "SAIDA";
const ADJUST_LABEL: Record<AdjustType, string> = {
  AJUSTE: "Ajuste de inventário (informar saldo contado)",
  PERDA: "Perda",
  AVARIA: "Avaria",
  SAIDA: "Saída avulsa",
};

/** Ajuste/perda/avaria/saida. O servidor calcula a diferenca e recusa saldo negativo. */
export function StockAdjustmentForm({ item, onDone }: { item: StockItemDto; onDone: () => void }) {
  const adjust = useStockAdjustment();
  const [type, setType] = useState<AdjustType>("AJUSTE");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const errors = fieldErrors(adjust.error);
  const isCount = type === "AJUSTE";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const input =
      type === "AJUSTE"
        ? { type, stockItemId: item.id, countedQuantity: Number(amount), reason }
        : { type, stockItemId: item.id, quantity: Number(amount), reason };
    adjust.mutate(input, {
      onSuccess: (updated) => {
        toast.success(`Estoque atualizado. Novo saldo: ${updated.quantity}.`);
        onDone();
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-sm text-neutral-600">
        <strong className="text-neutral-900">
          {[item.epiName, sizeLabel(item.size)].filter(Boolean).join(" · ")}
        </strong>
        <br />
        Saldo atual: {item.quantity}
      </p>
      <Field label="Tipo de movimentação">
        <Select value={type} onChange={(e) => setType(e.target.value as AdjustType)}>
          {(Object.keys(ADJUST_LABEL) as AdjustType[]).map((t) => (
            <option key={t} value={t}>
              {ADJUST_LABEL[t]}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label={isCount ? "Saldo contado" : "Quantidade retirada"}
        required
        error={isCount ? errors.countedQuantity : errors.quantity}
      >
        <Input
          type="number"
          inputMode="numeric"
          min={isCount ? 0 : 1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <Field label="Motivo" required error={errors.reason}>
        <Input value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <InlineError error={Object.keys(errors).length ? null : adjust.error} />
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={adjust.isPending}
        disabled={amount === "" || reason.trim().length < 3}
      >
        Confirmar
      </Button>
    </form>
  );
}
