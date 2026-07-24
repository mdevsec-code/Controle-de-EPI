import { createBrowserRouter, Outlet } from "react-router-dom";
import { LoginPage } from "../features/auth/login-page";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { EmployeeFoundPage } from "../features/delivery/employee-found-page";
import { HistoryPage } from "../features/delivery/history/history-page";
import { QuantitiesPage } from "../features/delivery/quantities-page";
import { ReasonPage } from "../features/delivery/reason-page";
import { ScannerPage } from "../features/delivery/scanner-page";
import { SelectEpisPage } from "../features/delivery/select-epis-page";
import { SignaturePage } from "../features/delivery/signature-page";
import { SuccessPage } from "../features/delivery/success-page";
import { MenuPage } from "../features/menu/menu-page";
import { ErrorPage } from "./error-page";
import { ShellLayout } from "./layout/shell-layout";

export const router = createBrowserRouter([
  {
    element: <Outlet />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/login", element: <LoginPage /> },

      {
        element: <ShellLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/entregas/historico", element: <HistoryPage /> },
          { path: "/menu", element: <MenuPage /> },
        ],
      },

      { path: "/entregas/nova", element: <ScannerPage /> },
      { path: "/entregas/nova/funcionario", element: <EmployeeFoundPage /> },
      { path: "/entregas/nova/epis", element: <SelectEpisPage /> },
      { path: "/entregas/nova/quantidades", element: <QuantitiesPage /> },
      { path: "/entregas/nova/motivo", element: <ReasonPage /> },
      { path: "/entregas/nova/assinatura", element: <SignaturePage /> },
      { path: "/entregas/nova/sucesso", element: <SuccessPage /> },
    ],
  },
]);
