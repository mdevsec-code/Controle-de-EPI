import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface FocusHeaderProps {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}

export function FocusHeader({ title, onBack, action }: FocusHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 dark:border-neutral-700 dark:bg-neutral-800">
      <button
        type="button"
        onClick={onBack ?? (() => navigate(-1))}
        aria-label="Voltar"
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="flex-1 text-center text-base font-semibold text-neutral-900 sm:text-left dark:text-neutral-50">
        {title}
      </h1>
      <div className="flex h-9 w-9 items-center justify-center">{action}</div>
    </header>
  );
}
