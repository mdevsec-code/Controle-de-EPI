import type { EpiDto } from "@epi-manager/contracts";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError, Spinner } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast-store";
import { fieldErrors } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { CA_STATUS_LABEL } from "@/lib/labels";
import {
  useCancelCa,
  useCreateCa,
  useCreateCategory,
  useEpiCas,
  useEpiCategories,
  useSaveEpi,
} from "./api";

const toNumber = (value: string) => (value.trim() === "" ? undefined : Number(value));

/** Cadastro/edicao de EPI. O CA e cadastrado a parte (historico de CAs). */
export function EpiForm({ epi, onDone }: { epi?: EpiDto; onDone: () => void }) {
  const categories = useEpiCategories();
  const createCategory = useCreateCategory();
  const save = useSaveEpi(epi?.id);
  const [newCategory, setNewCategory] = useState("");
  const [form, setForm] = useState({
    name: epi?.name ?? "",
    internalCode: epi?.internalCode ?? "",
    categoryId: epi?.categoryId ?? "",
    manufacturer: epi?.manufacturer ?? "",
    model: epi?.model ?? "",
    minQuantity: String(epi?.minQuantity ?? 0),
    usefulLifeDays: epi?.usefulLifeDays ? String(epi.usefulLifeDays) : "",
    unitPrice: epi?.unitPriceCents != null ? (epi.unitPriceCents / 100).toFixed(2) : "",
    active: epi?.active ?? true,
  });
  const errors = fieldErrors(save.error);
  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const price = toNumber(form.unitPrice.replace(",", "."));
    const common = {
      name: form.name,
      categoryId: form.categoryId,
      manufacturer: form.manufacturer,
      model: form.model || undefined,
      minQuantity: toNumber(form.minQuantity),
      usefulLifeDays: toNumber(form.usefulLifeDays),
      unitPriceCents: price === undefined ? undefined : Math.round(price * 100),
    };
    save.mutate(
      epi ? { ...common, active: form.active } : { ...common, internalCode: form.internalCode },
      {
        onSuccess: () => {
          toast.success(
            epi ? "EPI atualizado." : "EPI cadastrado. Registre o CA para liberar a entrega.",
          );
          onDone();
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Nome" required error={errors.name}>
        <Input value={form.name} onChange={(e) => set("name")(e.target.value)} />
      </Field>
      {!epi && (
        <Field label="Código interno" required error={errors.internalCode}>
          <Input value={form.internalCode} onChange={(e) => set("internalCode")(e.target.value)} />
        </Field>
      )}
      <Field label="Categoria" required error={errors.categoryId}>
        <Select value={form.categoryId} onChange={(e) => set("categoryId")(e.target.value)}>
          <option value="">Selecione</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex items-end gap-2">
        <Field label="Nova categoria" className="flex-1">
          <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
        </Field>
        <Button
          variant="outline"
          disabled={newCategory.trim().length < 2}
          loading={createCategory.isPending}
          onClick={() =>
            createCategory.mutate(newCategory.trim(), {
              onSuccess: (category) => {
                set("categoryId")(category.id);
                setNewCategory("");
              },
              onError: () => toast.error("Não foi possível criar a categoria (nome já existe?)."),
            })
          }
        >
          Criar
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fabricante" required error={errors.manufacturer}>
          <Input value={form.manufacturer} onChange={(e) => set("manufacturer")(e.target.value)} />
        </Field>
        <Field label="Modelo" error={errors.model}>
          <Input value={form.model} onChange={(e) => set("model")(e.target.value)} />
        </Field>
        <Field label="Estoque mínimo" error={errors.minQuantity}>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={form.minQuantity}
            onChange={(e) => set("minQuantity")(e.target.value)}
          />
        </Field>
        <Field label="Vida útil (dias)" error={errors.usefulLifeDays}>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={form.usefulLifeDays}
            onChange={(e) => set("usefulLifeDays")(e.target.value)}
          />
        </Field>
        <Field label="Valor unitário (R$)" error={errors.unitPriceCents}>
          <Input
            inputMode="decimal"
            value={form.unitPrice}
            onChange={(e) => set("unitPrice")(e.target.value)}
          />
        </Field>
      </div>
      {epi && (
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-neutral-700">
          <input
            type="checkbox"
            className="h-5 w-5 accent-primary-600"
            checked={form.active}
            onChange={(e) => set("active")(e.target.checked)}
          />
          Ativo (disponível para entrega)
        </label>
      )}
      <InlineError error={Object.keys(errors).length ? null : save.error} />
      <Button type="submit" fullWidth size="lg" loading={save.isPending}>
        Salvar
      </Button>
    </form>
  );
}

/** Historico de CAs do EPI: o vigente e usado (e congelado) em cada entrega. */
export function CaManager({ epi }: { epi: EpiDto }) {
  const cas = useEpiCas(epi.id);
  const create = useCreateCa(epi.id);
  const cancel = useCancelCa(epi.id);
  const [form, setForm] = useState({ number: "", issuedAt: "", expiresAt: "" });
  const errors = fieldErrors(create.error);

  return (
    <div className="space-y-5">
      {cas.isPending ? (
        <Spinner />
      ) : cas.data?.length === 0 ? (
        <EmptyState
          title="Nenhum CA cadastrado"
          description="Sem CA vigente o EPI não pode ser entregue (NR-6)."
        />
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-control border border-neutral-100">
          {cas.data?.map((ca) => (
            <li key={ca.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <div className="flex-1">
                <p className="font-bold">CA {ca.number}</p>
                <p className="text-sm text-neutral-600">
                  {formatDate(ca.issuedAt)} a {formatDate(ca.expiresAt)}
                </p>
              </div>
              <Badge
                tone={
                  ca.status === "VIGENTE"
                    ? "success"
                    : ca.status === "VENCIDO"
                      ? "warning"
                      : "neutral"
                }
              >
                {CA_STATUS_LABEL[ca.status]}
              </Badge>
              {ca.status !== "CANCELADO" && (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={cancel.isPending && cancel.variables === ca.id}
                  onClick={() => cancel.mutate(ca.id)}
                >
                  Cancelar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="space-y-3 rounded-control bg-neutral-50 p-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(form, {
            onSuccess: () => {
              toast.success("CA registrado.");
              setForm({ number: "", issuedAt: "", expiresAt: "" });
            },
          });
        }}
      >
        <h3 className="font-bold text-neutral-900">Registrar novo CA</h3>
        <Field label="Número do CA" required error={errors.number}>
          <Input
            inputMode="numeric"
            value={form.number}
            onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Emissão" required error={errors.issuedAt}>
            <Input
              type="date"
              value={form.issuedAt}
              onChange={(e) => setForm((f) => ({ ...f, issuedAt: e.target.value }))}
            />
          </Field>
          <Field label="Validade" required error={errors.expiresAt}>
            <Input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </Field>
        </div>
        <InlineError error={Object.keys(errors).length ? null : create.error} />
        <Button
          type="submit"
          loading={create.isPending}
          disabled={!form.number || !form.issuedAt || !form.expiresAt}
        >
          Registrar CA
        </Button>
      </form>
    </div>
  );
}
