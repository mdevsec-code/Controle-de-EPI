import { AlertTriangle } from "lucide-react";
import { Link, useRouteError } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button-variants";

/**
 * Erro de renderizacao/rota. Mostra mensagem util e NUNCA o stack trace;
 * o detalhe tecnico vai apenas para o console do navegador.
 */
export function ErrorPage({ notFound }: { notFound?: boolean }) {
  const error = useRouteError();
  if (error && !notFound) console.error(error);

  // Novo deploy: chunks antigos somem do servidor; recarregar resolve.
  const staleChunk =
    error instanceof TypeError &&
    /dynamically imported module|Importing a module script/i.test(error.message);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-500">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-bold text-neutral-900">
        {notFound ? "Página não encontrada" : "Algo deu errado"}
      </h1>
      <p className="max-w-sm text-sm text-neutral-500">
        {notFound
          ? "O endereço acessado não existe."
          : staleChunk
            ? "O sistema foi atualizado. Recarregue a página para continuar."
            : "Não foi possível exibir esta tela. Tente novamente; se persistir, avise o suporte."}
      </p>
      {staleChunk ? (
        <button
          type="button"
          className={buttonVariants({ size: "lg" })}
          onClick={() => window.location.reload()}
        >
          Recarregar
        </button>
      ) : (
        <Link to="/" className={buttonVariants({ size: "lg" })}>
          Voltar ao início
        </Link>
      )}
    </div>
  );
}
