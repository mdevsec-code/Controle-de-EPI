import { prisma } from "@epi-manager/database";
import { beforeEach, describe, expect, it } from "vitest";
import { api, createScenario, createUser, deliveryBody, resetDatabase } from "./fixtures.js";

beforeEach(resetDatabase);

describe("POST /api/deliveries", () => {
  it("registra a entrega: baixa o estoque, gera movimentacao com saldos, snapshot do CA, assinatura e auditoria", async () => {
    const s = await createScenario({ stock: 10 });

    const res = await api(s.almox.token).post("/api/deliveries").send(deliveryBody(s, 3));

    expect(res.status).toBe(201);
    expect(res.body.number).toBeGreaterThan(0);
    expect(res.body.deliveredBy.id).toBe(s.almox.user.id);
    expect(res.body.items[0]).toMatchObject({
      epiName: "Mascara PFF2",
      caNumber: "12345",
      quantity: 3,
    });
    expect(res.body.signature.contentHash).toMatch(/^[0-9a-f]{64}$/);

    const stock = await prisma.stockItem.findUniqueOrThrow({ where: { id: s.stockItem.id } });
    expect(stock.quantity).toBe(7);

    const movements = await prisma.stockMovement.findMany({
      where: { stockItemId: s.stockItem.id },
    });
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({
      type: "ENTREGA",
      delta: -3,
      balanceBefore: 10,
      balanceAfter: 7,
    });

    const audit = await prisma.auditLog.findFirst({
      where: { action: "ENTREGA_REGISTRADA", entityId: res.body.id },
    });
    expect(audit?.userId).toBe(s.almox.user.id);
  });

  it("concorrencia: 10 entregas simultaneas disputando 1 unidade -> exatamente 1 sucesso e saldo 0", async () => {
    const s = await createScenario({ stock: 1 });

    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        api(s.almox.token).post("/api/deliveries").send(deliveryBody(s, 1)),
      ),
    );

    const statuses = responses.map((r) => r.status).sort();
    expect(statuses.filter((code) => code === 201)).toHaveLength(1);
    expect(statuses.filter((code) => code === 409)).toHaveLength(9);
    for (const r of responses.filter((x) => x.status === 409)) {
      expect(r.body.error.code).toBe("ESTOQUE_INSUFICIENTE");
    }

    const stock = await prisma.stockItem.findUniqueOrThrow({ where: { id: s.stockItem.id } });
    expect(stock.quantity).toBe(0);
    expect(await prisma.delivery.count()).toBe(1);
    expect(await prisma.stockMovement.count()).toBe(1);
  });

  it("idempotencia: reenviar a mesma entrega devolve a ja registrada sem baixar de novo", async () => {
    const s = await createScenario({ stock: 5 });
    const body = deliveryBody(s, 2);

    const first = await api(s.almox.token).post("/api/deliveries").send(body);
    const second = await api(s.almox.token).post("/api/deliveries").send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    expect(
      (await prisma.stockItem.findUniqueOrThrow({ where: { id: s.stockItem.id } })).quantity,
    ).toBe(3);
  });

  it("estoque insuficiente em um dos itens desfaz tudo (nenhuma baixa parcial)", async () => {
    const s = await createScenario({ stock: 5 });
    const scarce = await prisma.stockItem.create({
      data: { warehouseId: s.warehouse.id, epiItemId: s.epi.id, size: "G", quantity: 1 },
    });

    const res = await api(s.almox.token)
      .post("/api/deliveries")
      .send(
        deliveryBody(s, 1, {
          items: [
            { stockItemId: s.stockItem.id, quantity: 2 },
            { stockItemId: scarce.id, quantity: 3 },
          ],
        }),
      );

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ESTOQUE_INSUFICIENTE");
    expect(res.body.error.details).toEqual([
      expect.objectContaining({ stockItemId: scarce.id, requested: 3, available: 1 }),
    ]);
    expect(
      (await prisma.stockItem.findUniqueOrThrow({ where: { id: s.stockItem.id } })).quantity,
    ).toBe(5);
    expect(await prisma.delivery.count()).toBe(0);
    expect(await prisma.stockMovement.count()).toBe(0);
  });

  it("recusa colaborador bloqueado", async () => {
    const s = await createScenario();
    await prisma.employee.update({ where: { id: s.employee.id }, data: { status: "BLOQUEADO" } });

    const res = await api(s.almox.token).post("/api/deliveries").send(deliveryBody(s));

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("COLABORADOR_INDISPONIVEL");
  });

  it("recusa EPI sem CA vigente (NR-6)", async () => {
    const s = await createScenario();
    await prisma.epiCA.updateMany({
      where: { epiItemId: s.epi.id },
      data: { expiresAt: new Date("2020-01-01") },
    });

    const res = await api(s.almox.token).post("/api/deliveries").send(deliveryBody(s));

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("CA_INVALIDO");
  });

  it("almoxarife nao registra entrega em almoxarifado ao qual nao esta vinculado", async () => {
    const s = await createScenario();
    const outsider = await createUser("ALMOXARIFADO", []);

    const res = await api(outsider.token).post("/api/deliveries").send(deliveryBody(s));

    expect(res.status).toBe(403);
    expect(await prisma.delivery.count()).toBe(0);
  });

  it("recusa assinatura que nao e PNG", async () => {
    const s = await createScenario();
    const fake =
      "data:image/png;base64," +
      Buffer.from("<svg>" + "x".repeat(100) + "</svg>").toString("base64");

    const res = await api(s.almox.token)
      .post("/api/deliveries")
      .send(deliveryBody(s, 1, { signature: fake }));

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDACAO");
  });
});

describe("historico, detalhe e devolucao", () => {
  it("almoxarife de outro almoxarifado nao ve a entrega (404, nao revela existencia)", async () => {
    const s = await createScenario();
    const created = await api(s.almox.token).post("/api/deliveries").send(deliveryBody(s, 1));
    const outsider = await createUser("ALMOXARIFADO", []);

    expect((await api(outsider.token).get(`/api/deliveries/${created.body.id}`)).status).toBe(404);
    expect(
      (await api(outsider.token).get(`/api/deliveries/${created.body.id}/signature`)).status,
    ).toBe(404);
    const list = await api(outsider.token).get("/api/deliveries");
    expect(list.body.total).toBe(0);
  });

  it("lista por matricula e serve a assinatura como PNG", async () => {
    const s = await createScenario();
    const created = await api(s.almox.token).post("/api/deliveries").send(deliveryBody(s, 2));

    const list = await api(s.almox.token).get(`/api/deliveries?q=${s.employee.registration}`);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0]).toMatchObject({
      totalQuantity: 2,
      employeeName: "Joao Carlos da Silva",
    });

    const image = await api(s.almox.token).get(`/api/deliveries/${created.body.id}/signature`);
    expect(image.status).toBe(200);
    expect(image.headers["content-type"]).toBe("image/png");
  });

  it("devolucao em bom estado volta ao estoque; nao permite devolver mais que o entregue", async () => {
    const s = await createScenario({ stock: 10 });
    const created = await api(s.almox.token).post("/api/deliveries").send(deliveryBody(s, 3));
    const itemId = created.body.items[0].id;

    const ok = await api(s.almox.token)
      .post(`/api/deliveries/${created.body.id}/returns`)
      .send({ deliveryItemId: itemId, quantity: 2, condition: "BOM" });
    expect(ok.status).toBe(201);
    expect(ok.body.restocked).toBe(true);
    expect(
      (await prisma.stockItem.findUniqueOrThrow({ where: { id: s.stockItem.id } })).quantity,
    ).toBe(9);

    const tooMany = await api(s.almox.token)
      .post(`/api/deliveries/${created.body.id}/returns`)
      .send({ deliveryItemId: itemId, quantity: 2, condition: "DANIFICADO" });
    expect(tooMany.status).toBe(422);
    expect(tooMany.body.error.code).toBe("DEVOLUCAO_EXCEDE_ENTREGUE");

    const detail = await api(s.almox.token).get(`/api/deliveries/${created.body.id}`);
    expect(detail.body.items[0].returnedQuantity).toBe(2);
  });

  it("dashboard resume o dia no escopo do almoxarife", async () => {
    const s = await createScenario({ stock: 10 });
    await api(s.almox.token).post("/api/deliveries").send(deliveryBody(s, 1));
    await api(s.almox.token).post("/api/deliveries").send(deliveryBody(s, 1));

    const res = await api(s.almox.token).get("/api/dashboard/summary");

    expect(res.status).toBe(200);
    expect(res.body.today).toEqual({ deliveries: 2, employeesServed: 1, epiTypes: 1 });
    expect(res.body.recentDeliveries).toHaveLength(2);
    // Serie de 7 dias termina hoje e conta as mesmas entregas.
    expect(res.body.week).toHaveLength(7);
    expect(res.body.week.at(-1).deliveries).toBe(2);
    expect(
      res.body.week.reduce((sum: number, d: { deliveries: number }) => sum + d.deliveries, 0),
    ).toBe(2);
    // O item do cenario tem saldo e ainda nao tem local marcado.
    expect(res.body.unplacedStockCount).toBe(1);
  });
});
