import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { RequireAuth, RequireRole } from "./guards";
import { useSessionStore } from "./session-store";

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <p>tela de login</p> },
      {
        element: <RequireAuth />,
        children: [
          { path: "/", element: <p>inicio</p> },
          { path: "/conta/senha", element: <p>trocar senha</p> },
          {
            path: "/usuarios",
            element: <RequireRole roles={["ADMIN"]}>{<p>usuarios</p>}</RequireRole>,
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

const login = (role: "ADMIN" | "ALMOXARIFADO", mustChangePassword = false) =>
  useSessionStore.getState().setSession({
    accessToken: "t",
    expiresIn: 900,
    user: { id: "u", name: "U", email: "u@x.com", role, mustChangePassword, warehouses: [] },
  });

beforeEach(() => useSessionStore.getState().clear());

describe("guardas de rota", () => {
  it("sem sessao, redireciona para o login", () => {
    renderAt("/");
    expect(screen.getByText("tela de login")).toBeInTheDocument();
  });

  it("troca de senha obrigatoria bloqueia o resto do app", () => {
    login("ALMOXARIFADO", true);
    renderAt("/");
    expect(screen.getByText("trocar senha")).toBeInTheDocument();
  });

  it("perfil sem acesso ve aviso em vez da pagina", () => {
    login("ALMOXARIFADO");
    renderAt("/usuarios");
    expect(screen.queryByText("usuarios")).not.toBeInTheDocument();
    expect(screen.getByText("Acesso restrito")).toBeInTheDocument();
  });

  it("ADMIN acessa a pagina de usuarios", () => {
    login("ADMIN");
    renderAt("/usuarios");
    expect(screen.getByText("usuarios")).toBeInTheDocument();
  });
});
