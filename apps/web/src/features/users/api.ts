import type {
  CreateUserRequest,
  Page,
  ResetPasswordRequest,
  UpdateUserRequest,
  UserDto,
  WarehouseDto,
} from "@epi-manager/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useUsers(page: number) {
  return useQuery({
    queryKey: ["users", page],
    queryFn: () => api.get<Page<UserDto>>("/users", { page, pageSize: 50 }),
  });
}

export function useWarehouses() {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: () => api.get<WarehouseDto[]>("/warehouses"),
    staleTime: 5 * 60_000,
  });
}

export function useSaveUser(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserRequest | UpdateUserRequest) =>
      id ? api.patch<UserDto>(`/users/${id}`, input) : api.post<UserDto>("/users", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useResetPassword(id: string) {
  return useMutation({
    mutationFn: (input: ResetPasswordRequest) =>
      api.post<void>(`/users/${id}/reset-password`, input),
  });
}
