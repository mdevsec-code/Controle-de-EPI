import { STOCK_LOCATION_MAX_LENGTH, type StockItemDto } from "@epi-manager/contracts";
import { MapPin } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { useStockLocations, useUpdateStockLocation } from "./api";
import { locationsOf, NO_LOCATION, variantLabel } from "./stock-groups";

/** Etiqueta "onde esta guardado"; destaca em laranja-escuro quando ainda nao foi marcado. */
export function LocationTag({ items, className }: { items: StockItemDto[]; className?: string }) {
  const locations = locationsOf(items);
  const missing = items.some((i) => !i.location);
  const text =
    locations.length === 0
      ? NO_LOCATION
      : locations.length === 1 && !missing
        ? locations[0]
        : `${locations.length + (missing ? 1 : 0)} locais`;
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1 text-xs font-semibold",
        locations.length === 0 ? "text-warning-700" : "text-neutral-600",
        className,
      )}
    >
      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{text}</span>
    </span>
  );
}

/** Marca o local de um ou varios itens (ex.: todos os tamanhos guardados no mesmo gaveteiro). */
export function LocationForm({
  items,
  warehouseId,
  onDone,
}: {
  items: StockItemDto[];
  warehouseId: string;
  onDone: () => void;
}) {
  const current = locationsOf(items);
  const [location, setLocation] = useState(current.length === 1 ? current[0]! : "");
  const suggestions = useStockLocations(warehouseId);
  const update = useUpdateStockLocation();
  const ids = items.map((i) => i.id);

  const save = (value: string) =>
    update.mutate(
      { ids, location: value.trim() },
      {
        onSuccess: () => {
          toast.success(value.trim() ? `Local marcado: ${value.trim()}.` : "Local removido.");
          onDone();
        },
      },
    );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save(location);
  };

  const others = (suggestions.data ?? []).filter((s) => s !== location.trim()).slice(0, 8);

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-sm text-neutral-600">
        <strong className="text-neutral-900">{items[0]?.epiName}</strong>
        <br />
        {items.length === 1
          ? variantLabel(items[0]!, Boolean(items[0]!.model))
          : `Será aplicado a ${items.length} variações (${items
              .slice(0, 4)
              .map((i) => variantLabel(i))
              .join(", ")}${items.length > 4 ? "..." : ""}).`}
      </p>
      <Field
        label="Local de armazenamento"
        hint={`${location.length}/${STOCK_LOCATION_MAX_LENGTH}`}
      >
        <Input
          value={location}
          maxLength={STOCK_LOCATION_MAX_LENGTH}
          placeholder="Ex.: Corredor A · Prateleira 2"
          icon={<MapPin className="h-4.5 w-4.5" />}
          onChange={(e) => setLocation(e.target.value)}
        />
      </Field>
      {others.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold text-neutral-500">Locais já usados</p>
          <div className="flex flex-wrap gap-2">
            {others.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setLocation(s)}
                className="min-h-9 rounded-full bg-neutral-150 px-3.5 text-[13px] font-semibold text-neutral-700 transition-colors duration-150 hover:bg-primary-100 hover:text-primary-700"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <InlineError error={update.error} />
      <div className="grid gap-2">
        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={update.isPending}
          disabled={!location.trim()}
        >
          Salvar local
        </Button>
        {current.length > 0 && (
          <Button variant="ghost" fullWidth disabled={update.isPending} onClick={() => save("")}>
            Remover local
          </Button>
        )}
      </div>
    </form>
  );
}
