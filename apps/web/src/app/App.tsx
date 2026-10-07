import { QueryClientProvider } from "@tanstack/react-query";
import * as m from "motion/react-m";
import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { MotionProvider } from "@/components/motion/motion-provider";
import { Logo } from "@/components/ui/controls";
import { ToastRegion } from "@/components/ui/toast";
import { useSessionStore } from "@/features/auth/session-store";
import { refreshSession } from "@/lib/api-client";
import { queryClient } from "./query-client";
import { router } from "./router";

/** Restaura a sessao pelo cookie de refresh antes de decidir entre login e app. */
function SessionGate() {
  const status = useSessionStore((s) => s.status);
  useEffect(() => {
    if (useSessionStore.getState().status === "unknown") void refreshSession();
  }, []);

  if (status === "unknown") {
    return (
      <div
        role="status"
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-white"
      >
        <m.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Logo className="w-60" />
        </m.div>
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }
  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <SessionGate />
        <ToastRegion />
      </MotionProvider>
    </QueryClientProvider>
  );
}
