import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordRequestSchema, PASSWORD_MIN_LENGTH } from "@epi-manager/contracts";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { Card, PageHeader } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast-store";
import { fieldErrors } from "@/lib/errors";
import { useChangePassword, useCurrentUser } from "./auth-api";

const formSchema = changePasswordRequestSchema
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof formSchema>;

export function ChangePasswordPage() {
  const user = useCurrentUser();
  const changePassword = useChangePassword();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const serverFields = fieldErrors(changePassword.error);
  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(({ currentPassword, newPassword }) =>
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success("Senha alterada. As outras sessões foram encerradas.");
          navigate("/", { replace: true });
        },
      },
    ),
  );

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:py-10">
      <PageHeader
        title="Alterar senha"
        description={
          user.mustChangePassword
            ? "Por segurança, defina uma nova senha antes de continuar."
            : "A troca encerra as sessões abertas em outros aparelhos."
        }
      />
      <Card className="p-5">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label="Senha atual" error={errors.currentPassword?.message} required>
            <Input
              type="password"
              autoComplete="current-password"
              {...form.register("currentPassword")}
            />
          </Field>
          <Field
            label="Nova senha"
            hint={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`}
            error={errors.newPassword?.message ?? serverFields.newPassword}
            required
          >
            <Input type="password" autoComplete="new-password" {...form.register("newPassword")} />
          </Field>
          <Field label="Confirmar nova senha" error={errors.confirmPassword?.message} required>
            <Input
              type="password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
          </Field>
          <InlineError error={Object.keys(serverFields).length ? null : changePassword.error} />
          <Button type="submit" fullWidth size="lg" loading={changePassword.isPending}>
            Salvar nova senha
          </Button>
        </form>
      </Card>
    </div>
  );
}
