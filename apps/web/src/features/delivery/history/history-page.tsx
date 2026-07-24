import { Filter, Search } from "lucide-react";
import { useState } from "react";
import { Avatar } from "../../../shared/components/avatar";
import { Card } from "../../../shared/components/ui/card";
import { cn } from "../../../shared/lib/cn";
import { MOCK_HISTORY } from "../mock-data";

const PERIOD_FILTERS = ["Hoje", "Ontem", "Esta semana", "Este mes"] as const;

export function HistoryPage() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<(typeof PERIOD_FILTERS)[number]>("Hoje");

  const filtered = MOCK_HISTORY.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="text-lg font-semibold text-neutral-900 sm:text-xl dark:text-neutral-50">
        Historico de entregas
      </h1>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou matricula"
            className="h-11 w-full rounded-md border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
          />
        </div>
        <button
          type="button"
          aria-label="Filtros"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-neutral-300 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {PERIOD_FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPeriod(option)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              period === option
                ? "bg-primary-600 text-white"
                : "bg-white text-neutral-600 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <Card className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-700">
        {filtered.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-4">
            <span className="w-12 shrink-0 text-xs text-neutral-400">{item.time}</span>
            <Avatar name={item.name} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{item.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.epi}</p>
            </div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{item.quantity} un.</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-neutral-400">Nenhuma entrega encontrada.</p>
        )}
      </Card>
    </div>
  );
}
