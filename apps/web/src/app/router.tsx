import { lazy, type ComponentType } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RequireAuth, RequireRole } from "@/features/auth/guards";
import { LoginPage } from "@/features/auth/login-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { ErrorPage } from "./error-page";
import { AppShell } from "./layout/app-shell";
import { FullScreenSuspense } from "./layout/full-screen-layout";
import { MenuPage } from "./layout/menu-page";

/** Code splitting por rota: cada tela vira um chunk carregado sob demanda. */
function page<K extends string>(loader: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => loader().then((module) => ({ default: module[name] })));
}

const IdentifyPage = page(() => import("@/features/deliveries/flow/identify-page"), "IdentifyPage");
const ScannerPage = page(() => import("@/features/deliveries/flow/scanner-page"), "ScannerPage");
const EmployeePage = page(() => import("@/features/deliveries/flow/employee-page"), "EmployeePage");
const SelectEpisPage = page(
  () => import("@/features/deliveries/flow/select-epis-page"),
  "SelectEpisPage",
);
const QuantitiesPage = page(
  () => import("@/features/deliveries/flow/quantities-page"),
  "QuantitiesPage",
);
const ReasonPage = page(() => import("@/features/deliveries/flow/reason-page"), "ReasonPage");
const SignaturePage = page(
  () => import("@/features/deliveries/flow/signature-page"),
  "SignaturePage",
);
const SuccessPage = page(() => import("@/features/deliveries/flow/success-page"), "SuccessPage");
const HistoryPage = page(() => import("@/features/deliveries/history-page"), "HistoryPage");
const DeliveryDetailPage = page(
  () => import("@/features/deliveries/delivery-detail-page"),
  "DeliveryDetailPage",
);
const ReceiptPage = page(() => import("@/features/deliveries/receipt-page"), "ReceiptPage");
const StockPage = page(() => import("@/features/stock/stock-page"), "StockPage");
const EpisPage = page(() => import("@/features/epis/epis-page"), "EpisPage");
const EmployeesPage = page(() => import("@/features/employees/employees-page"), "EmployeesPage");
const EmployeeDetailPage = page(
  () => import("@/features/employees/employee-detail-page"),
  "EmployeeDetailPage",
);
const UsersPage = page(() => import("@/features/users/users-page"), "UsersPage");
const ChangePasswordPage = page(
  () => import("@/features/auth/change-password-page"),
  "ChangePasswordPage",
);

export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      { path: "/login", element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            // Fluxo de entrega e comprovante: tela cheia, sem menu (foco na operacao).
            element: <FullScreenSuspense />,
            children: [
              { path: "/entregas/nova", element: <IdentifyPage /> },
              { path: "/entregas/nova/scanner", element: <ScannerPage /> },
              { path: "/entregas/nova/colaborador", element: <EmployeePage /> },
              { path: "/entregas/nova/epis", element: <SelectEpisPage /> },
              { path: "/entregas/nova/quantidades", element: <QuantitiesPage /> },
              { path: "/entregas/nova/motivo", element: <ReasonPage /> },
              { path: "/entregas/nova/assinatura", element: <SignaturePage /> },
              { path: "/entregas/nova/concluida", element: <SuccessPage /> },
              { path: "/entregas/:id/comprovante", element: <ReceiptPage /> },
            ],
          },
          {
            element: <AppShell />,
            children: [
              { path: "/", element: <DashboardPage /> },
              { path: "/menu", element: <MenuPage /> },
              { path: "/entregas", element: <HistoryPage /> },
              { path: "/entregas/:id", element: <DeliveryDetailPage /> },
              { path: "/estoque", element: <StockPage /> },
              { path: "/epis", element: <EpisPage /> },
              { path: "/colaboradores", element: <EmployeesPage /> },
              { path: "/colaboradores/:id", element: <EmployeeDetailPage /> },
              { path: "/conta/senha", element: <ChangePasswordPage /> },
              {
                element: <RequireRole roles={["ADMIN"]} />,
                children: [{ path: "/usuarios", element: <UsersPage /> }],
              },
              { path: "*", element: <ErrorPage notFound /> },
            ],
          },
        ],
      },
    ],
  },
]);
