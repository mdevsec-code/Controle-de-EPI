import type {
  CaDto,
  CreateCaRequest,
  CreateEpiRequest,
  EpiCategoryDto,
  EpiDto,
  ListEpisQuery,
  Page,
  UpdateEpiRequest,
} from "@epi-manager/contracts";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const epiKeys = {
  all: ["epis"] as const,
  list: (query: ListEpisQuery) => ["epis", "list", query] as const,
  cas: (id: string) => ["epis", "cas", id] as const,
};

export function useEpis(query: ListEpisQuery) {
  return useQuery({
    queryKey: epiKeys.list(query),
    queryFn: ({ signal }) => api.get<Page<EpiDto>>("/epis", { ...query }, signal),
    placeholderData: keepPreviousData,
  });
}

export function useEpiCategories() {
  return useQuery({
    queryKey: ["epi-categories"],
    queryFn: () => api.get<EpiCategoryDto[]>("/epi-categories"),
    staleTime: 5 * 60_000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<EpiCategoryDto>("/epi-categories", { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["epi-categories"] }),
  });
}

export function useSaveEpi(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEpiRequest | UpdateEpiRequest) =>
      id ? api.patch<EpiDto>(`/epis/${id}`, input) : api.post<EpiDto>("/epis", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: epiKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useEpiCas(id: string | undefined) {
  return useQuery({
    queryKey: epiKeys.cas(id ?? ""),
    queryFn: () => api.get<CaDto[]>(`/epis/${id}/cas`),
    enabled: Boolean(id),
  });
}

export function useCreateCa(epiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCaRequest) => api.post<CaDto>(`/epis/${epiId}/cas`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: epiKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useCancelCa(epiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (caId: string) => api.post<CaDto>(`/epis/${epiId}/cas/${caId}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: epiKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}
