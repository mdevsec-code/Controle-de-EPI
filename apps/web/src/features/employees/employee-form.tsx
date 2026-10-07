import type { EmployeeDto } from "@epi-manager/contracts";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast-store";
import { fieldErrors } from "@/lib/errors";
import { useOrganizationOptions, useSaveEmployee } from "./api";

/** Cadastro/edicao de colaborador (ADMIN). Empresa e derivada da unidade. */
export function EmployeeForm({
  employee,
  onDone,
}: {
  employee?: EmployeeDto;
  onDone: (saved: EmployeeDto) => void;
}) {
  const { units, departments, jobRoles } = useOrganizationOptions(true);
  const save = useSaveEmployee(employee?.id);
  const [form, setForm] = useState({
    name: employee?.name ?? "",
    registration: employee?.registration ?? "",
    cpf: "",
    businessUnitId: employee?.businessUnitId ?? "",
    departmentId: employee?.departmentId ?? "",
    jobRoleId: employee?.jobRoleId ?? "",
    costCenter: employee?.costCenter ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    admissionDate: employee?.admissionDate?.slice(0, 10) ?? "",
  });
  const errors = fieldErrors(save.error);
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const unitDepartments =
    departments.data?.items.filter((d) => d.businessUnitId === form.businessUnitId) ?? [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const common = {
      name: form.name,
      departmentId: form.departmentId,
      jobRoleId: form.jobRoleId,
      costCenter: form.costCenter || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      admissionDate: form.admissionDate || undefined,
    };
    save.mutate(
      employee
        ? common
        : {
            ...common,
            registration: form.registration,
            cpf: form.cpf,
            businessUnitId: form.businessUnitId,
          },
      {
        onSuccess: (saved) => {
          toast.success(employee ? "Colaborador atualizado." : "Colaborador cadastrado.");
          onDone(saved);
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Nome completo" required error={errors.name}>
        <Input value={form.name} onChange={(e) => set("name")(e.target.value)} />
      </Field>
      {!employee && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Matrícula" required error={errors.registration}>
            <Input
              value={form.registration}
              onChange={(e) => set("registration")(e.target.value)}
            />
          </Field>
          <Field label="CPF" required error={errors.cpf}>
            <Input
              inputMode="numeric"
              value={form.cpf}
              onChange={(e) => set("cpf")(e.target.value)}
              placeholder="000.000.000-00"
            />
          </Field>
        </div>
      )}
      {!employee && (
        <Field label="Unidade" required error={errors.businessUnitId}>
          <Select
            value={form.businessUnitId}
            onChange={(e) =>
              setForm((f) => ({ ...f, businessUnitId: e.target.value, departmentId: "" }))
            }
          >
            <option value="">Selecione</option>
            {units.data?.items.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Setor" required error={errors.departmentId}>
          <Select value={form.departmentId} onChange={(e) => set("departmentId")(e.target.value)}>
            <option value="">Selecione</option>
            {unitDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Função" required error={errors.jobRoleId}>
          <Select value={form.jobRoleId} onChange={(e) => set("jobRoleId")(e.target.value)}>
            <option value="">Selecione</option>
            {jobRoles.data?.items.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Centro de custo" error={errors.costCenter}>
          <Input value={form.costCenter} onChange={(e) => set("costCenter")(e.target.value)} />
        </Field>
        <Field label="Admissão" error={errors.admissionDate}>
          <Input
            type="date"
            value={form.admissionDate}
            onChange={(e) => set("admissionDate")(e.target.value)}
          />
        </Field>
        <Field label="E-mail" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />
        </Field>
        <Field label="Telefone" error={errors.phone}>
          <Input type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
        </Field>
      </div>
      <InlineError error={Object.keys(errors).length ? null : save.error} />
      <Button type="submit" fullWidth size="lg" loading={save.isPending}>
        Salvar
      </Button>
    </form>
  );
}
