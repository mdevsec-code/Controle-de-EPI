import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FocusHeader } from "../../app/layout/focus-header";
import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { Checkbox } from "../../shared/components/ui/checkbox";
import { Input } from "../../shared/components/ui/input";
import { MOCK_EPI_CATALOG } from "./mock-data";
import { useDeliveryFlowStore } from "./store";

export function SelectEpisPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const selected = useDeliveryFlowStore((state) => state.selected);
  const toggleEpi = useDeliveryFlowStore((state) => state.toggleEpi);
  const selectedCount = Object.keys(selected).length;

  const filteredCatalog = useMemo(
    () => MOCK_EPI_CATALOG.filter((epi) => epi.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <FocusHeader title="Selecionar EPI" />

      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar EPI"
            className="pl-9"
          />
        </div>

        <p className="mb-2 mt-6 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Selecione o(s) EPI(s) entregue(s)
        </p>

        <Card className="divide-y divide-neutral-100 dark:divide-neutral-700">
          {filteredCatalog.map((epi) => (
            <div key={epi.id} className="flex items-center justify-between p-4">
              <Checkbox
                id={`epi-${epi.id}`}
                checked={Boolean(selected[epi.id])}
                onChange={() => toggleEpi(epi)}
                label={epi.name}
              />
              <span className="text-xs text-neutral-400">CA {epi.ca}</span>
            </div>
          ))}
          {filteredCatalog.length === 0 && (
            <p className="p-6 text-center text-sm text-neutral-400">Nenhum EPI encontrado.</p>
          )}
        </Card>
      </div>

      <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4 sm:px-6 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mx-auto max-w-xl">
          <Button
            fullWidth
            size="lg"
            disabled={selectedCount === 0}
            onClick={() => navigate("/entregas/nova/quantidades")}
          >
            Continuar {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
