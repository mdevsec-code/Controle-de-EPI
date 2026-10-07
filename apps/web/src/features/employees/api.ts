import type {
  BadgeCodeResponse,
  BusinessUnitDto,
  ChangeEmployeeStatusRequest,
  CreateEmployeeRequest,
  DepartmentDto,
  EmployeeDto,
  EmployeeSummaryDto,
  JobRoleDto,
  ListEmployeesQuery,
  Page,
  UpdateEmployeeRequest,
} from "@epi-manager/contracts";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const employeeKeys = {
  all: ["employees"] as const,
  list: (query: ListEmployeesQuery) => ["employees", "list", query] as const,
  detail: (id: string) => ["employees", "detail", id] as const,
};

export function useEmployees(query: ListEmployeesQuery, enabled = true) {
  return useQuery({
    queryKey: employeeKeys.list(query),
    queryFn: ({ signal }) => api.get<Page<EmployeeDto>>("/employees", { ...query }, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(id ?? ""),
    queryFn: ({ signal }) => api.get<EmployeeDto>(`/employees/${id}`, undefined, signal),
    enabled: Boolean(id),
  });
}

export const fetchEmployeeByBadge = (code: string) =>
  api.get<EmployeeSummaryDto>(`/employees/by-badge/${encodeURIComponent(code)}`);

export function useSaveEmployee(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeRequest | UpdateEmployeeRequest) =>
      id
        ? api.patch<EmployeeDto>(`/employees/${id}`, input)
        : api.post<EmployeeDto>("/employees", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useChangeEmployeeStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChangeEmployeeStatusRequest) =>
      api.patch<EmployeeDto>(`/employees/${id}/status`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useReissueBadge(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<BadgeCodeResponse>(`/employees/${id}/badge`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) }),
  });
}

/** Listas de apoio do cadastro (somente ADMIN). Volume pequeno: busca ate 100 de uma vez. */
export function useOrganizationOptions(enabled: boolean) {
  const units = useQuery({
    queryKey: ["business-units"],
    queryFn: () => api.get<Page<BusinessUnitDto>>("/business-units", { pageSize: 100 }),
    enabled,
    staleTime: 5 * 60_000,
  });
  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<Page<DepartmentDto>>("/departments", { pageSize: 100 }),
    enabled,
    staleTime: 5 * 60_000,
  });
  const jobRoles = useQuery({
    queryKey: ["job-roles"],
    queryFn: () => api.get<Page<JobRoleDto>>("/job-roles", { pageSize: 100 }),
    enabled,
    staleTime: 5 * 60_000,
  });
  return { units, departments, jobRoles };
}
