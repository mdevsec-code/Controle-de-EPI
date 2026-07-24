import { AlertTriangle } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { Button } from "../shared/components/ui/button";

export function ErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : "Erro inesperado";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 p-6 text-center dark:bg-neutral-900">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-50 text-danger-600 dark:bg-danger-500/10">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
        Algo deu errado
      </h1>
      <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
      <Button onClick={() => window.location.assign("/")}>Voltar ao inicio</Button>
    </div>
  );
}
