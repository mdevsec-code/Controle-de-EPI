import {
  PASSWORD_MIN_LENGTH,
  USER_ROLES,
  type UserDto,
  type UserRole,
} from "@epi-manager/contracts";
import { KeyRound, Pencil, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, InlineError, SkeletonList } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge, Card, PageHeader } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast-store";
import { fieldErrors } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/labels";
import { useResetPassword, useSaveUser, useUsers, useWarehouses } from "./api";

function UserForm({ user, onDone }: { user?: UserDto; onDone: () => void }) {
  const warehouses = useWarehouses();
  const save = useSaveUser(user?.id);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "ALMOXARIFADO");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(user?.active ?? true);
  const [warehouseIds, setWarehouseIds] = useState<string[]>(
    user?.warehouses.map((w) => w.id) ?? [],
  );
  const errors = fieldErrors(save.error);

  const toggleWarehouse = (id: string) =>
    setWarehouseIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate(
      user ? { name, role, active, warehouseIds } : { name, email, role, password, warehouseIds },
      {
        onSuccess: () => {
          toast.success(
            user
              ? "Usuário atualizado."
              : "Usuário criado. Ele deverá trocar a senha no primeiro acesso.",
          );
          onDone();
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Nome" required error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      {!user && (
        <Field label="E-mail (login)" required error={errors.email}>
          <Input
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
      )}
      <Field label="Perfil" required>
        <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
      </Field>
      {!user && (
        <Field
          label="Senha provisória"
          required
          hint={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`}
          error={errors.password}
        >
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      )}
      <fieldset className="space-y-1">
        <legend className="mb-1 text-sm font-semibold text-neutral-700">Almoxarifados</legend>
        {role === "ADMIN" && (
          <p className="text-xs text-neutral-600">
            Administradores acessam todos os almoxarifados.
          </p>
        )}
        {warehouses.data?.map((w) => (
          <label key={w.id} className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-5 w-5 accent-primary-600"
              checked={warehouseIds.includes(w.id)}
              onChange={() => toggleWarehouse(w.id)}
            />
            {w.name} <span className="text-neutral-600">({w.businessUnitName})</span>
          </label>
        ))}
      </fieldset>
      {user && (
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-neutral-700">
          <input
            type="checkbox"
            className="h-5 w-5 accent-primary-600"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Usuário ativo
        </label>
      )}
      <InlineError error={Object.keys(errors).length ? null : save.error} />
      <Button type="submit" fullWidth size="lg" loading={save.isPending}>
        Salvar
      </Button>
    </form>
  );
}

function ResetPasswordForm({ user, onDone }: { user: UserDto; onDone: () => void }) {
  const reset = useResetPassword(user.id);
  const [password, setPassword] = useState("");
  const errors = fieldErrors(reset.error);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        reset.mutate(
          { password },
          {
            onSuccess: () => {
              toast.success("Senha redefinida. As sessões do usuário foram encerradas.");
              onDone();
            },
          },
        );
      }}
    >
      <p className="text-sm text-neutral-600">
        Defina uma senha provisória para <strong>{user.name}</strong>. Ele deverá trocá-la no
        próximo acesso.
      </p>
      <Field
        label="Nova senha provisória"
        required
        hint={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`}
        error={errors.password}
      >
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <InlineError error={Object.keys(errors).length ? null : reset.error} />
      <Button type="submit" fullWidth loading={reset.isPending}>
        Redefinir senha
      </Button>
    </form>
  );
}

type DialogState = { kind: "new" } | { kind: "edit" | "password"; user: UserDto } | null;

export function UsersPage() {
  const users = useUsers(1);
  const [dialog, setDialog] = useState<DialogState>(null);
  const close = () => setDialog(null);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:px-8 lg:py-10">
      <PageHeader
        title="Usuários"
        description="Quem acessa o sistema e em quais almoxarifados."
        actions={
          <Button onClick={() => setDialog({ kind: "new" })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo usuário
          </Button>
        }
      />
      <Card className="overflow-hidden">
        {users.isPending ? (
          <SkeletonList rows={4} label="Carregando usuários..." />
        ) : users.isError ? (
          <ErrorState error={users.error} onRetry={() => void users.refetch()} />
        ) : users.data.items.length === 0 ? (
          <EmptyState title="Nenhum usuário" />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {users.data.items.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-neutral-900">{u.name}</p>
                  <p className="truncate text-sm text-neutral-600">
                    {u.email} · {u.warehouses.map((w) => w.name).join(", ") || "sem almoxarifado"}
                  </p>
                  <p className="text-xs text-neutral-600">
                    Último acesso: {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "nunca"}
                  </p>
                </div>
                <Badge tone={u.role === "ADMIN" ? "primary" : "neutral"}>
                  {ROLE_LABEL[u.role]}
                </Badge>
                {!u.active && <Badge tone="danger">Inativo</Badge>}
                {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                  <Badge tone="warning">Bloqueado</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Redefinir senha de ${u.name}`}
                  onClick={() => setDialog({ kind: "password", user: u })}
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Editar ${u.name}`}
                  onClick={() => setDialog({ kind: "edit", user: u })}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog
        open={dialog?.kind === "new" || dialog?.kind === "edit"}
        onClose={close}
        title={dialog?.kind === "edit" ? "Editar usuário" : "Novo usuário"}
      >
        {dialog?.kind === "new" && <UserForm onDone={close} />}
        {dialog?.kind === "edit" && <UserForm user={dialog.user} onDone={close} />}
      </Dialog>
      <Dialog open={dialog?.kind === "password"} onClose={close} title="Redefinir senha">
        {dialog?.kind === "password" && <ResetPasswordForm user={dialog.user} onDone={close} />}
      </Dialog>
    </div>
  );
}
