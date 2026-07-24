import { Outlet } from "react-router-dom";
import { AppShell } from "./app-shell";

export function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
