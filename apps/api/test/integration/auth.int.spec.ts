import { prisma } from "@epi-manager/database";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { api, app, createScenario, createUser, resetDatabase } from "./fixtures.js";

beforeEach(resetDatabase);

function refreshCookie(res: request.Response): string {
  const cookies = res.headers["set-cookie"] as unknown as string[] | undefined;
  const cookie = cookies?.find((c) => c.startsWith("epi_refresh="));
  if (!cookie) throw new Error("cookie de refresh ausente");
  return cookie.split(";")[0]!;
}

describe("autenticacao", () => {
  it("login devolve access token no corpo e refresh apenas em cookie httpOnly/Strict", async () => {
    const { user, password } = await createUser("ADMIN");

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email.toUpperCase(), password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf("string");
    expect(res.body).not.toHaveProperty("refreshToken");
    const raw = (res.headers["set-cookie"] as unknown as string[]).join(";");
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=Strict/i);
    expect(raw).toMatch(/Path=\/api\/auth/);
  });

  it("senha errada repetida bloqueia a conta", async () => {
    const { user } = await createUser("ALMOXARIFADO");
    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/auth/login").send({ email: user.email, password: "errada" });
    }
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "Senha@Forte123" });
    expect(res.status).toBe(423);
    expect(res.body.error.code).toBe("CONTA_BLOQUEADA");
    expect(await prisma.auditLog.count({ where: { action: "LOGIN_FALHA", userId: user.id } })).toBe(
      5,
    );
  });

  it("refresh rotaciona; reapresentar o token antigo depois da janela revoga todas as sessoes", async () => {
    const { user, password } = await createUser("ADMIN");
    const login = await request(app).post("/api/auth/login").send({ email: user.email, password });
    const oldCookie = refreshCookie(login);

    const refreshed = await request(app).post("/api/auth/refresh").set("Cookie", oldCookie);
    expect(refreshed.status).toBe(200);
    const newCookie = refreshCookie(refreshed);

    // Simula o atacante usando o token antigo depois da janela de tolerancia.
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: { not: null } },
      data: { revokedAt: new Date(Date.now() - 60_000) },
    });
    const reuse = await request(app).post("/api/auth/refresh").set("Cookie", oldCookie);
    expect(reuse.status).toBe(401);

    const legit = await request(app).post("/api/auth/refresh").set("Cookie", newCookie);
    expect(legit.status).toBe(401);
    expect(await prisma.auditLog.count({ where: { action: "SESSAO_REUSO_DETECTADO" } })).toBe(1);
  });

  it("desativar o usuario invalida o access token imediatamente", async () => {
    const s = await createScenario();
    expect((await api(s.almox.token).get("/api/auth/me")).status).toBe(200);

    const admin = await createUser("ADMIN");
    const res = await api(admin.token)
      .patch(`/api/users/${s.almox.user.id}`)
      .send({ active: false });
    expect(res.status).toBe(200);

    const after = await api(s.almox.token).get("/api/auth/me");
    expect(after.status).toBe(401);
    expect(after.body.error.code).toBe("SESSAO_EXPIRADA");
  });

  it("logout revoga o refresh token", async () => {
    const { user, password } = await createUser("ADMIN");
    const login = await request(app).post("/api/auth/login").send({ email: user.email, password });
    const cookie = refreshCookie(login);

    expect((await request(app).post("/api/auth/logout").set("Cookie", cookie)).status).toBe(204);
    expect((await request(app).post("/api/auth/refresh").set("Cookie", cookie)).status).toBe(401);
  });
});

describe("autorizacao (backend, nao so na UI)", () => {
  it("sem token: 401 estruturado", async () => {
    const res = await request(app).get("/api/employees");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("NAO_AUTENTICADO");
  });

  it("ALMOXARIFADO nao acessa rotas de ADMIN", async () => {
    const s = await createScenario();
    const almox = api(s.almox.token);
    expect((await almox.get("/api/users")).status).toBe(403);
    expect((await almox.get("/api/companies")).status).toBe(403);
    expect((await almox.post("/api/employees").send({})).status).toBe(403);
    expect(
      (await almox.patch(`/api/employees/${s.employee.id}/status`).send({ status: "BLOQUEADO" }))
        .status,
    ).toBe(403);
  });

  it("ALMOXARIFADO recebe CPF mascarado e nao recebe o codigo do cracha; ADMIN recebe ambos", async () => {
    const s = await createScenario();
    const admin = await createUser("ADMIN");

    const asAlmox = await api(s.almox.token).get(`/api/employees/${s.employee.id}`);
    expect(asAlmox.body.cpf).toMatch(/^\*\*\*\.\d{3}\.\d{3}-\*\*$/);
    expect(asAlmox.body.badgeCode).toBeNull();

    const asAdmin = await api(admin.token).get(`/api/employees/${s.employee.id}`);
    expect(asAdmin.body.cpf).toBe(s.employee.cpf);
    expect(asAdmin.body.badgeCode).toBe(s.employee.badgeCode);
  });

  it("ALMOXARIFADO nao ve colaborador de unidade fora do seu escopo", async () => {
    const s = await createScenario();
    const other = await createScenario();

    expect((await api(s.almox.token).get(`/api/employees/${other.employee.id}`)).status).toBe(404);
    const list = await api(s.almox.token).get("/api/employees");
    expect(list.body.items.map((e: { id: string }) => e.id)).toEqual([s.employee.id]);
  });

  it("leitura do cracha resolve pelo codigo opaco; codigo reemitido invalida o antigo", async () => {
    const s = await createScenario();
    const admin = await createUser("ADMIN");

    const found = await api(s.almox.token).get(`/api/employees/by-badge/${s.employee.badgeCode}`);
    expect(found.status).toBe(200);
    expect(found.body).not.toHaveProperty("cpf");

    await api(admin.token).post(`/api/employees/${s.employee.id}/badge`);
    expect(
      (await api(s.almox.token).get(`/api/employees/by-badge/${s.employee.badgeCode}`)).status,
    ).toBe(404);
  });
});
