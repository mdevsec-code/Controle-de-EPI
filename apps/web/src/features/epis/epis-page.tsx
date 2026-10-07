import type { EpiDto } from "@epi-manager/contracts";
import { FileBadge, Pencil, Plus } from "lucide-react";
import * as m from "motion/react-m";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/feedback";
import { Badge, Card, PageHeader } from "@/components/ui/surface";
import { epiIcon } from "@/lib/epi-icons";
import { formatDate } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { useEpis } from "./api";
import { CaManager, EpiForm } from "./epi-forms";

type Editing =
  { kind: "new" } | { kind: "edit"; epi: EpiDto } | { kind: "cas"; epi: EpiDto } | null;

export function EpisPage() {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const epis = useEpis({ q: query.trim() || undefined, pageSize: 100 });
  const close = () => setEditing(null);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:px-8 lg:py-10">
      <PageHeader
        title="EPIs"
        description="Equipamentos e certificados de aprovação (CA). Sem CA vigente, o EPI não pode ser entregue."
        actions={
          <Button onClick={() => setEditing({ kind: "new" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo EPI
          </Button>
        }
      />
      <SearchInput
        label="Buscar EPI por nome ou código"
        placeholder="Nome ou código"
        value={query}
        onChange={setQuery}
      />

      <div className="mt-5">
        {epis.isPending ? (
          <Card className="overflow-hidden">
            <SkeletonList rows={6} label="Carregando EPIs..." />
          </Card>
        ) : epis.isError ? (
          <Card>
            <ErrorState error={epis.error} onRetry={() => void epis.refetch()} />
          </Card>
        ) : epis.data.items.length === 0 ? (
          <Card>
            <EmptyState title="Nenhum EPI encontrado" />
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {epis.data.items.map((epi, index) => {
              const Icon = epiIcon(epi.categoryName, epi.name);
              return (
                <m.li
                  key={epi.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(index, 12) * 0.03,
                    duration: 0.3,
                    ease: EASE,
                  }}
                >
                  <Card className="flex h-full flex-col overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-150 text-primary-500">
                        <Icon className="h-7 w-7" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold leading-tight text-neutral-900">
                          {epi.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-neutral-500">{epi.internalCode}</p>
                        <p className="mt-1 truncate text-xs text-neutral-500">
                          {epi.categoryName} · {epi.manufacturer}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Editar ${epi.name}`}
                        onClick={() => setEditing({ kind: "edit", epi })}
                        className="-mr-2 -mt-1"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-neutral-100 px-4 py-3">
                      {epi.currentCa ? (
                        <Badge tone="success">
                          <span className="font-mono">CA {epi.currentCa.number}</span> · até{" "}
                          {formatDate(epi.currentCa.expiresAt)}
                        </Badge>
                      ) : (
                        <Badge tone="danger">Sem CA vigente</Badge>
                      )}
                      <div className="flex items-center gap-2">
                        {!epi.active && <Badge>Inativo</Badge>}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing({ kind: "cas", epi })}
                        >
                          <FileBadge className="h-4 w-4" aria-hidden="true" />
                          CAs
                        </Button>
                      </div>
                    </div>
                  </Card>
                </m.li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={editing?.kind === "new" || editing?.kind === "edit"}
        onClose={close}
        title={editing?.kind === "edit" ? "Editar EPI" : "Novo EPI"}
      >
        {editing?.kind === "new" && <EpiForm onDone={close} />}
        {editing?.kind === "edit" && <EpiForm epi={editing.epi} onDone={close} />}
      </Dialog>
      <Dialog
        open={editing?.kind === "cas"}
        onClose={close}
        title={editing?.kind === "cas" ? `CAs · ${editing.epi.name}` : "CAs"}
      >
        {editing?.kind === "cas" && <CaManager epi={editing.epi} />}
      </Dialog>
    </div>
  );
}
