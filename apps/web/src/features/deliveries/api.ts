import type {
  CreateDeliveryRequest,
  CreateReturnRequest,
  DashboardSummaryDto,
  DeliveryDto,
  DeliveryListItemDto,
  EpiReturnDto,
  ListDeliveriesQuery,
  Page,
} from "@epi-manager/contracts";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

export const deliveryKeys = {
  all: ["deliveries"] as const,
  list: (query: ListDeliveriesQuery) => ["deliveries", "list", query] as const,
  detail: (id: string) => ["deliveries", "detail", id] as const,
};

export function useDeliveries(query: ListDeliveriesQuery) {
  return useQuery({
    queryKey: deliveryKeys.list(query),
    queryFn: ({ signal }) =>
      api.get<Page<DeliveryListItemDto>>("/deliveries", { ...query }, signal),
    placeholderData: keepPreviousData,
  });
}

export function useDelivery(id: string | undefined) {
  return useQuery({
    queryKey: deliveryKeys.detail(id ?? ""),
    queryFn: ({ signal }) => api.get<DeliveryDto>(`/deliveries/${id}`, undefined, signal),
    enabled: Boolean(id),
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: ({ signal }) => api.get<DashboardSummaryDto>("/dashboard/summary", undefined, signal),
    refetchInterval: 60_000,
  });
}

export function useRegisterDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeliveryRequest) => api.post<DeliveryDto>("/deliveries", input),
    // Sem retry automatico: o reenvio manual e seguro (idempotencyKey), mas fica sob controle do usuario.
    retry: false,
    onSuccess: (delivery) => {
      queryClient.setQueryData(deliveryKeys.detail(delivery.id), delivery);
      void queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["stock"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRegisterReturn(deliveryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReturnRequest) =>
      api.post<EpiReturnDto>(`/deliveries/${deliveryId}/returns`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(deliveryId) });
      void queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

/** Imagem da assinatura (rota autenticada) como object URL, liberada ao desmontar. */
export function useSignatureImage(deliveryId: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!deliveryId) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    api
      .blob(`/deliveries/${deliveryId}/signature`, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(null));
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [deliveryId]);
  return url;
}
