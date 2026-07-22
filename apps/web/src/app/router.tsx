import { createBrowserRouter } from "react-router-dom";
import { DashboardPage } from "./pages/dashboard-page";
import { LoginPage } from "./pages/login-page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <DashboardPage />,
  },
]);
