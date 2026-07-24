import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "../../shared/components/ui/button";
import { Checkbox } from "../../shared/components/ui/checkbox";
import { Input } from "../../shared/components/ui/input";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-900">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary-700 to-primary-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">EPI Manager</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Controle completo do ciclo de vida dos EPIs da sua operacao.
          </h2>
          <p className="mt-4 text-sm text-primary-100">
            Cadastro, estoque, entregas, devolucoes e auditoria em um unico sistema corporativo.
          </p>
        </div>
        <p className="text-xs text-primary-200">EPI Manager - versao 1.0.0</p>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              EPI Manager
            </span>
          </div>

          <h1 className="text-center text-xl font-semibold text-neutral-900 lg:text-left dark:text-neutral-50">
            Controle de entrega de EPIs
          </h1>
          <p className="mt-1 text-center text-sm text-neutral-500 lg:text-left dark:text-neutral-400">
            Faca login para continuar
          </p>

          <form className="mt-8 space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Usuario
              </label>
              <Input id="username" name="username" type="text" autoComplete="username" placeholder="seu.usuario" />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="********"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Checkbox id="remember" name="remember" label="Lembrar de mim" />
              <a href="#" className="font-medium text-primary-600 hover:text-primary-700">
                Esqueci minha senha
              </a>
            </div>

            <Button type="submit" fullWidth size="lg">
              <LogIn className="h-4 w-4" />
              Entrar
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-neutral-400">Versao 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
