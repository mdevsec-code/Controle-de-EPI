import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 lg:flex">
      <Sidebar />
      <main className="min-h-screen flex-1 pb-20 lg:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
