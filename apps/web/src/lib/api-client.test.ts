import type { SessionResponse } from "@epi-manager/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/features/auth/session-store";
import { api, ApiError } from "./api-client";

const session = (token: string): SessionResponse => ({
  accessToken: token,
  expiresIn: 900,
  user: {
    id: "u1",
    name: "Marcio",
    email: "m@x.com",
    role: "ALMOXARIFADO",
    mustChangePassword: false,
    warehouses: [],
  },
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  useSessionStore.getState().setSession(session("expirado"));
});

afterEach(() => vi.unstubAllGlobals());

describe("api-client", () => {
  it("401 em requisicoes simultaneas dispara UM refresh e repete cada uma com o token novo", async () => {
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url === "/api/auth/refresh") return json(200, session("novo"));
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === "Bearer novo"
        ? json(200, { ok: url })
        : json(401, { error: { code: "SESSAO_EXPIRADA", message: "x" } });
    });

    const results = await Promise.all([api.get("/a"), api.get("/b"), api.get("/c")]);

    expect(results).toEqual([{ ok: "/api/a" }, { ok: "/api/b" }, { ok: "/api/c" }]);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/auth/refresh")).toHaveLength(1);
    expect(useSessionStore.getState().accessToken).toBe("novo");
  });

  it("refresh recusado encerra a sessao local e propaga o erro", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/auth/refresh"
        ? json(401, { error: { code: "SESSAO_EXPIRADA", message: "x" } })
        : json(401, { error: { code: "SESSAO_EXPIRADA", message: "x" } }),
    );

    await expect(api.get("/a")).rejects.toMatchObject({ code: "SESSAO_EXPIRADA", status: 401 });
    expect(useSessionStore.getState().status).toBe("anonymous");
    expect(useSessionStore.getState().accessToken).toBeNull();
  });

  it("erro estruturado vira ApiError com codigo e detalhes; falha de rede vira REDE", async () => {
    fetchMock.mockResolvedValueOnce(
      json(409, { error: { code: "ESTOQUE_INSUFICIENTE", message: "m", details: [1] } }),
    );
    const error = await api.post("/deliveries", {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "ESTOQUE_INSUFICIENTE", status: 409, details: [1] });

    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(api.get("/x")).rejects.toMatchObject({ code: "REDE" });
  });

  it("serializa query: omite vazios e converte datas para ISO", async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}));
    await api.get("/deliveries", {
      q: "",
      page: 2,
      from: new Date("2026-10-06T03:00:00.000Z"),
      to: undefined,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/deliveries?page=2&from=2026-10-06T03%3A00%3A00.000Z",
    );
  });
});
