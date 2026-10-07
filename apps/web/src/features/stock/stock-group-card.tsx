import type { StockItemDto } from "@epi-manager/contracts";
import { MapPin, SlidersHorizontal } from "lucide-react";
import * as m from "motion/react-m";
import { useState } from "react";
import { CountUp } from "@/components/motion/primitives";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Badge, Card } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { epiIcon } from "@/lib/epi-icons";
import { EASE } from "@/lib/motion";
import { LocationTag } from "./stock-location";
import {
  filterVariants,
  isLow,
  modelOf,
  modelsOf,
  sizesOf,
  variantLabel,
  type StockGroup,
} from "./stock-groups";

/** Barra de nivel: escala ate 3x o minimo (ou o saldo, se maior); marca o minimo com um traco. */
export function LevelBar({ quantity, min }: { quantity: number; min: number }) {
  const scale = Math.max(min * 3, quantity, 1);
  const low = quantity < min;
  return (
    <div className="relative mt-3 h-2 rounded-full bg-neutral-100" aria-hidden="true">
      <m.span
        className={cn(
          "absolute inset-y-0 left-0 rounded-full",
          low ? "bg-warning-600" : "bg-primary-500",
        )}
        initial={false}
        animate={{ width: `${Math.min(100, (quantity / scale) * 100)}%` }}
        transition={{ duration: 0.5, ease: EASE }}
      />
      {min > 0 && (
        <span
          className="absolute -top-1 h-4 w-0.5 rounded bg-neutral-600/60"
          style={{ left: `${(min / scale) * 100}%` }}
        />
      )}
    </div>
  );
}

/** Chips de filtro do legado (laranja quando ativo). */
function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string | null; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div role="group" aria-label={label} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value ?? "__all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150",
              active
                ? "bg-primary-500 text-white"
                : "bg-neutral-150 text-neutral-600 hover:bg-neutral-100",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Um card por equipamento. Modelo e tamanho viram filtros dentro do card, no lugar de um
 * card repetido para cada variacao.
 */
export function StockGroupCard({
  group,
  index,
  onAdjust,
  onLocate,
}: {
  group: StockGroup;
  index: number;
  onAdjust: (item: StockItemDto) => void;
  onLocate: (items: StockItemDto[]) => void;
}) {
  const [model, setModel] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const first = group.items[0]!;
  const Icon = epiIcon(group.categoryName, group.epiName);

  const models = modelsOf(group.items);
  const showModels = models.length > 1;
  const inModel = filterVariants(group.items, { model, size: null });
  const sizes = sizesOf(inModel);
  const showSizes = sizes.length > 1;
  const matched = filterVariants(group.items, { model, size: showSizes ? size : null });
  const single = matched.length === 1 ? matched[0]! : null;
  const total = matched.reduce((sum, i) => sum + i.quantity, 0);
  const lowCount = matched.filter(isLow).length;
  const cas = [...new Set(matched.map((i) => i.caNumber))];

  const changeModel = (value: string | null) => {
    setModel(value);
    setSize(null);
  };
  /** Clique numa linha do detalhamento seleciona aquela variacao. */
  const pick = (item: StockItemDto) => {
    if (showModels) setModel(modelOf(item));
    setSize(item.size);
  };

  return (
    <m.li
      className="min-w-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.3, ease: EASE }}
    >
      <Card
        className={cn("flex h-full flex-col p-4", lowCount > 0 && "ring-1 ring-warning-600/40")}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-150 text-primary-500">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold leading-tight text-neutral-900">{group.epiName}</h3>
            <p className="mt-0.5 truncate text-xs text-neutral-500">
              {group.categoryName} ·{" "}
              {cas.length > 1 ? (
                `${cas.length} CAs`
              ) : cas[0] ? (
                <span className="font-mono">CA {cas[0]}</span>
              ) : (
                "Sem CA vigente"
              )}
              {group.items.length > 1 && ` · ${group.items.length} variações`}
            </p>
          </div>
          {lowCount > 0 && <Badge tone="warning">Abaixo do mínimo</Badge>}
        </div>

        {(showModels || showSizes) && (
          <div className="mt-3 space-y-2">
            {showModels && (
              <Select
                aria-label={`Modelo de ${group.epiName}`}
                value={model ?? ""}
                onChange={(e) => changeModel(e.target.value === "" ? null : e.target.value)}
                className="min-h-10 text-[13px]"
              >
                <option value="">Todos os modelos</option>
                {models.map((name) => (
                  <option key={name} value={name}>
                    {name || "Sem modelo"}
                  </option>
                ))}
              </Select>
            )}
            {showSizes && (
              <Chips
                label={`Tamanho de ${group.epiName}`}
                value={size}
                onChange={setSize}
                options={[
                  { value: null, label: "Todos" },
                  ...sizes.map((s) => ({ value: s, label: s || "Único" })),
                ]}
              />
            )}
          </div>
        )}

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <CountUp
              value={total}
              className={cn(
                "font-display text-[26px] font-extrabold",
                lowCount > 0 ? "text-warning-700" : "text-neutral-900",
              )}
            />
            <span className="ml-1 text-xs text-neutral-500">em estoque</span>
          </div>
          {single && (
            <span className="text-[11px] text-neutral-500">mín. {single.minQuantity}</span>
          )}
        </div>
        {single && <LevelBar quantity={single.quantity} min={single.minQuantity} />}

        {!single && matched.length > 1 && (
          <ul className="mt-3 max-h-44 divide-y divide-neutral-100 overflow-y-auto rounded-xl border border-neutral-100">
            {matched.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => pick(item)}
                  className="flex min-h-10 w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors duration-150 hover:bg-neutral-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-neutral-900">
                      {variantLabel(item, showModels && model === null)}
                    </span>
                    {item.location && (
                      <span className="block truncate text-[11px] text-neutral-500">
                        {item.location}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "font-bold tabular",
                      isLow(item) ? "text-warning-700" : "text-neutral-900",
                    )}
                  >
                    {item.quantity}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
            <LocationTag items={matched} />
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLocate(matched)}
                aria-label={`Marcar local de ${first.epiName}`}
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Local
              </Button>
              {single && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAdjust(single)}
                  aria-label={`Movimentar estoque de ${first.epiName}`}
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </m.li>
  );
}
