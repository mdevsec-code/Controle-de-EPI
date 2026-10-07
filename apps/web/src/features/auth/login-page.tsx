import { zodResolver } from "@hookform/resolvers/zod";
import { loginRequestSchema, type LoginRequest } from "@epi-manager/contracts";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Lock, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Stagger, StaggerItem } from "@/components/motion/primitives";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/controls";
import { InlineError } from "@/components/ui/feedback";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { EASE } from "@/lib/motion";
import { useLogin } from "./auth-api";
import { LoginSkyline } from "./login-skyline";
import { useSessionStore } from "./session-store";

export function LoginPage() {
  const status = useSessionStore((s) => s.status);
  const login = useLogin();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  const [forgotOpen, setForgotOpen] = useState(false);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: "", password: "" },
  });

  if (status === "authenticated") return <Navigate to={from} replace />;

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, { onSuccess: () => navigate(from, { replace: true }) }),
  );

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-7 pt-[calc(3rem+env(safe-area-inset-top))]">
        <Stagger step={0.06}>
          <StaggerItem className="flex justify-center">
            <Logo className="w-72" />
          </StaggerItem>
          <StaggerItem className="mt-8 text-center">
            <h1 className="font-display font-extrabold uppercase leading-tight text-neutral-900">
              <span className="block text-lg">Controle de</span>
              <span className="block text-[26px]">
                Entrega de <span className="text-primary-500">EPIs</span>
              </span>
            </h1>
            <p className="mt-2 text-sm text-neutral-500">Faça login para continuar</p>
          </StaggerItem>

          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-3.5">
            <StaggerItem>
              <Field label="E-mail" hideLabel error={form.formState.errors.email?.message}>
                <Input
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  autoCapitalize="none"
                  placeholder="E-mail"
                  icon={<Mail className="h-[18px] w-[18px]" />}
                  {...form.register("email")}
                />
              </Field>
            </StaggerItem>

            <StaggerItem>
              <Field label="Senha" hideLabel error={form.formState.errors.password?.message}>
                <PasswordInput
                  autoComplete="current-password"
                  placeholder="Senha"
                  icon={<Lock className="h-[18px] w-[18px]" />}
                  {...form.register("password")}
                />
              </Field>
            </StaggerItem>

            <StaggerItem className="flex justify-end">
              <button
                type="button"
                onClick={() => setForgotOpen((v) => !v)}
                aria-expanded={forgotOpen}
                className="text-[13px] font-semibold text-primary-700 hover:underline"
              >
                Esqueci minha senha
              </button>
            </StaggerItem>
            <AnimatePresence initial={false}>
              {forgotOpen && (
                <m.p
                  className="overflow-hidden text-center text-xs text-neutral-500"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  Peça ao administrador do sistema para redefinir sua senha.
                </m.p>
              )}
            </AnimatePresence>

            <InlineError error={login.error} />

            <StaggerItem className="pt-2">
              <Button type="submit" size="lg" fullWidth loading={login.isPending}>
                {!login.isPending && <LogIn className="h-5 w-5" aria-hidden="true" />}
                Entrar
              </Button>
            </StaggerItem>
          </form>

          <StaggerItem>
            <p className="mt-5 text-center text-[11px] text-neutral-500">
              Versão {__APP_VERSION__}
            </p>
          </StaggerItem>
        </Stagger>
      </main>
      <LoginSkyline />
    </div>
  );
}
