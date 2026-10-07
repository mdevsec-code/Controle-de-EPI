import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Erros 4xx sao definitivos (permissao, validacao, nao encontrado): repetir nao ajuda.
      retry: (failureCount, error) =>
        failureCount < 2 &&
        (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
    },
  },
});
