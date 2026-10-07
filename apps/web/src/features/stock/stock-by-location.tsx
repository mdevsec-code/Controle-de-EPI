import type { StockItemDto } from "@epi-manager/contracts";
import { MapPin, SlidersHorizontal } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/primitives";
import { Badge, Card } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { epiIcon } from "@/lib/epi-icons";
import { isLow, NO_LOCATION, variantLabel } from "./stock-groups";

/** Agrupa por local; itens sem local ficam por ultimo, para chamar atencao. */
function byLocation(items: StockItemDto[]) {
  const map = new Map<string, StockItemDto[]>();
  for (const item of items) {
    const list = map.get(item.location);
    if (list) list.push(item);
    else map.set(item.location, [item]);
  }
  return [...map.entries()].sort(([a], [b]) =>
    a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "pt-BR", { numeric: true }),
  );
}

const iconButton =
  "flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-900";

/** Visao "Por local": o que esta guardado em cada corredor/prateleira (lista de separacao). */
export function StockByLocation({
  items,
  onAdjust,
  onLocate,
}: {
  items: StockItemDto[];
  onAdjust: (item: StockItemDto) => void;
  onLocate: (items: StockItemDto[]) => void;
}) {
  return (
    <Stagger className="space-y-5" step={0.04}>
      {byLocation(items).map(([location, list]) => (
        <StaggerItem as="div" key={location || "__none"}>
          <section aria-label={location || NO_LOCATION}>
            <h2
              className={cn(
                "mb-2 flex items-center gap-2 text-[14.5px] font-bold",
                location ? "text-neutral-900" : "text-warning-700",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg",
                  location ? "bg-primary-100 text-primary-600" : "bg-warning-50 text-warning-700",
                )}
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              {location || NO_LOCATION}
              <span className="text-xs font-semibold text-neutral-500">
                {list.length} {list.length === 1 ? "item" : "itens"}
              </span>
            </h2>
            <Card className="overflow-hidden">
              <ul className="divide-y divide-neutral-100">
                {list.map((item) => {
                  const Icon = epiIcon(item.categoryName, item.epiName);
                  const low = isLow(item);
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-150 text-primary-500">
                        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-bold text-neutral-900">
                          {item.epiName}
                        </span>
                        <span className="block truncate text-xs text-neutral-500">
                          {item.size || item.batchNumber || item.model
                            ? variantLabel(item, Boolean(item.model))
                            : item.categoryName}
                        </span>
                      </span>
                      {low && (
                        <Badge tone="warning" className="hidden sm:inline-flex">
                          Baixo
                        </Badge>
                      )}
                      <span
                        className={cn(
                          "w-10 text-right font-display text-base font-extrabold tabular",
                          low ? "text-warning-700" : "text-neutral-900",
                        )}
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => onLocate([item])}
                        aria-label={`Alterar local de ${item.epiName} (${variantLabel(item)})`}
                      >
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => onAdjust(item)}
                        aria-label={`Movimentar estoque de ${item.epiName} (${variantLabel(item)})`}
                      >
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
