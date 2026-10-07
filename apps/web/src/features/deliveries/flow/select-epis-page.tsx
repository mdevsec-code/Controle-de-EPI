import { ArrowRight, MapPin } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stagger, StaggerItem } from "@/components/motion/primitives";
import { Button } from "@/components/ui/button";
import { CheckboxRow } from "@/components/ui/choice";
import { SearchInput } from "@/components/ui/controls";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/feedback";
import { Card } from "@/components/ui/surface";
import { useStockItems } from "@/features/stock/api";
import { sizeLabel } from "@/lib/labels";
import { useDeliveryDraft } from "../draft";
import { FlowLayout } from "./flow-layout";
import { useRequireDraftStep } from "./use-flow";

/** Etapa 3: "Selecionar EPI" do legado (busca + lista com checkbox), com saldo do almoxarifado. */
export function SelectEpisPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { draft, blocked } = useRequireDraftStep("epis");
  const toggleItem = useDeliveryDraft((s) => s.toggleItem);
  const stock = useStockItems(
    {
      warehouseId: draft.warehouseId ?? undefined,
      available: true,
      q: query.trim() || undefined,
      pageSize: 100,
    },
    Boolean(draft.warehouseId) && !blocked,
  );
  if (blocked) return null;

  const selectedCount = Object.keys(draft.items).length;
  const label = selectedCount > 0 ? `Continuar (${selectedCount})` : "Continuar";

  return (
    <FlowLayout
      title="Selecionar EPI"
      step={1}
      backTo="/entregas/nova/colaborador"
      footer={
        <Button
          size="lg"
          fullWidth
          disabled={selectedCount === 0}
          onClick={() => navigate("/entregas/nova/quantidades")}
          trailingIcon={<ArrowRight className="h-5 w-5" />}
        >
          {label}
        </Button>
      }
    >
      <SearchInput
        label="Buscar EPI"
        placeholder="Buscar EPI"
        value={query}
        onChange={setQuery}
        autoComplete="off"
      />

      <h2 className="mb-2.5 mt-5 text-[13px] font-bold text-neutral-600">
        Selecione o(s) EPI(s) entregue(s)
      </h2>

      <Card className="overflow-hidden">
        {stock.isPending ? (
          <SkeletonList rows={6} label="Carregando estoque..." />
        ) : stock.isError ? (
          <ErrorState error={stock.error} onRetry={() => void stock.refetch()} />
        ) : stock.data.items.length === 0 ? (
          <EmptyState
            title={query ? "Nenhum EPI encontrado" : "Nenhum EPI com saldo neste almoxarifado"}
            description="Registre uma entrada de estoque para disponibilizar EPIs."
          />
        ) : (
          <Stagger as="ul" className="divide-y divide-neutral-100" step={0.025}>
            {stock.data.items.map((item) => {
              const noCa = item.caNumber === null;
              return (
                <StaggerItem as="li" key={item.id}>
                  <CheckboxRow
                    checked={Boolean(draft.items[item.id])}
                    onChange={() => toggleItem(item)}
                    disabled={noCa}
                    label={[item.epiName, sizeLabel(item.size)].filter(Boolean).join(" · ")}
                    description={
                      noCa ? (
                        "Sem CA vigente — não pode ser entregue"
                      ) : (
                        <>
                          {`CA ${item.caNumber} · ${item.quantity} em estoque${item.batchNumber ? ` · Lote ${item.batchNumber}` : ""}`}
                          {item.location && (
                            <span className="mt-0.5 flex items-center gap-1 text-neutral-600">
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                              {item.location}
                            </span>
                          )}
                        </>
                      )
                    }
                  />
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </Card>
    </FlowLayout>
  );
}
