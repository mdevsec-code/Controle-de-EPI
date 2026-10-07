import type {
  ListMovementsQuery,
  ListStockQuery,
  Page,
  StockAdjustmentRequest,
  StockEntryRequest,
  StockItemDto,
  StockMovementDto,
} from "@epi-manager/contracts";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const stockKeys = {
  all: ["stock"] as const,
  items: (query: ListStockQuery) => ["stock", "items", query] as const,
  movements: (query: ListMovementsQuery) => ["stock", "movements", query] as const,
  locations: (warehouseId: string) => ["stock", "locations", warehouseId] as const,
};

export function useStockItems(query: ListStockQuery, enabled = true) {
  return useQuery({
    queryKey: stockKeys.items(query),
    queryFn: ({ signal }) => api.get<Page<StockItemDto>>("/stock/items", { ...query }, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useStockMovements(query: ListMovementsQuery) {
  return useQuery({
    queryKey: stockKeys.movements(query),
    queryFn: ({ signal }) =>
      api.get<Page<StockMovementDto>>("/stock/movements", { ...query }, signal),
    placeholderData: keepPreviousData,
  });
}

function useStockMutation<T>(path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: T) => api.post<StockItemDto>(path, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: stockKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Locais ja usados no almoxarifado (sugestoes e filtro). */
export function useStockLocations(warehouseId: string) {
  return useQuery({
    queryKey: stockKeys.locations(warehouseId),
    queryFn: ({ signal }) => api.get<string[]>("/stock/locations", { warehouseId }, signal),
  });
}

/** Marca o mesmo local em um ou mais itens (ex.: todos os tamanhos de uma bota). */
export function useUpdateStockLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, location }: { ids: string[]; location: string }) => {
      for (const id of ids) {
        await api.patch<StockItemDto>(`/stock/items/${id}/location`, { location });
      }
    },
    // Mesmo com falha parcial, recarrega para mostrar o que ja foi gravado.
    onSettled: () => void queryClient.invalidateQueries({ queryKey: stockKeys.all }),
  });
}

export const useStockEntry = () => useStockMutation<StockEntryRequest>("/stock/entries");
export const useStockAdjustment = () =>
  useStockMutation<StockAdjustmentRequest>("/stock/adjustments");
