import { prisma } from "@epi-manager/database";
import { beforeEach, describe, expect, it } from "vitest";
import { api, createScenario, resetDatabase } from "./fixtures.js";

beforeEach(resetDatabase);

describe("estoque", () => {
  it("entrada cria o item (EPI x tamanho) e registra movimentacao ENTRADA", async () => {
    const s = await createScenario({ stock: 0 });

    const res = await api(s.almox.token).post("/api/stock/entries").send({
      warehouseId: s.warehouse.id,
      epiItemId: s.epi.id,
      size: "g",
      quantity: 25,
      reason: "NF 123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ size: "G", quantity: 25, caNumber: "12345" });
    const movement = await prisma.stockMovement.findFirstOrThrow({
      where: { stockItemId: res.body.id },
    });
    expect(movement).toMatchObject({
      type: "ENTRADA",
      delta: 25,
      balanceBefore: 0,
      balanceAfter: 25,
    });
  });

  it("ajuste de inventario calcula a diferenca a partir do saldo contado", async () => {
    const s = await createScenario({ stock: 10 });

    const res = await api(s.almox.token).post("/api/stock/adjustments").send({
      type: "AJUSTE",
      stockItemId: s.stockItem.id,
      countedQuantity: 7,
      reason: "Inventario mensal",
    });

    expect(res.status).toBe(201);
    expect(res.body.quantity).toBe(7);
    const movement = await prisma.stockMovement.findFirstOrThrow({
      where: { stockItemId: s.stockItem.id },
    });
    expect(movement).toMatchObject({
      type: "AJUSTE",
      delta: -3,
      balanceBefore: 10,
      balanceAfter: 7,
    });
  });

  it("perda maior que o saldo e recusada com ESTOQUE_INSUFICIENTE", async () => {
    const s = await createScenario({ stock: 2 });

    const res = await api(s.almox.token)
      .post("/api/stock/adjustments")
      .send({ type: "PERDA", stockItemId: s.stockItem.id, quantity: 3, reason: "Extraviado" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: "ESTOQUE_INSUFICIENTE" });
    expect(
      (await prisma.stockItem.findUniqueOrThrow({ where: { id: s.stockItem.id } })).quantity,
    ).toBe(2);
  });

  it("o banco recusa saldo negativo mesmo fora da aplicacao (CHECK constraint)", async () => {
    const s = await createScenario({ stock: 1 });
    await expect(
      prisma.$executeRaw`UPDATE "stock_items" SET "quantity" = -1 WHERE "id" = ${s.stockItem.id}`,
    ).rejects.toThrow();
  });

  it("historico de movimentacoes explica o saldo atual", async () => {
    const s = await createScenario({ stock: 0 });
    const entry = await api(s.almox.token)
      .post("/api/stock/entries")
      .send({ warehouseId: s.warehouse.id, epiItemId: s.epi.id, quantity: 10 });
    await api(s.almox.token).post("/api/stock/adjustments").send({
      type: "AVARIA",
      stockItemId: entry.body.id,
      quantity: 4,
      reason: "Molhou no deposito",
    });

    const res = await api(s.almox.token).get(`/api/stock/movements?stockItemId=${entry.body.id}`);

    expect(
      res.body.items.map((m: { type: string; balanceAfter: number }) => [m.type, m.balanceAfter]),
    ).toEqual([
      ["AVARIA", 6],
      ["ENTRADA", 10],
    ]);
  });

  it("filtro de estoque baixo compara saldo com o minimo do EPI", async () => {
    const s = await createScenario({ stock: 2 });
    await prisma.epiItem.update({ where: { id: s.epi.id }, data: { minQuantity: 5 } });

    const res = await api(s.almox.token).get("/api/stock/items?lowStock=true");

    expect(res.body.items.map((i: { id: string }) => i.id)).toEqual([s.stockItem.id]);
  });
});

describe("local de armazenamento", () => {
  it("marca o local, audita a mudanca e permite buscar por ele", async () => {
    const s = await createScenario({ stock: 5 });
    const almox = api(s.almox.token);

    const res = await almox
      .patch(`/api/stock/items/${s.stockItem.id}/location`)
      .send({ location: "  Corredor A · Prateleira 2 " });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ location: "Corredor A · Prateleira 2", quantity: 5 });
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { entity: "StockItem", entityId: s.stockItem.id, action: "ATUALIZAR" },
    });
    expect(audit.after).toEqual({ location: "Corredor A · Prateleira 2" });

    const bySearch = await almox.get("/api/stock/items?q=prateleira");
    expect(bySearch.body.items).toHaveLength(1);
    const locations = await almox.get(`/api/stock/locations?warehouseId=${s.warehouse.id}`);
    expect(locations.body).toEqual(["Corredor A · Prateleira 2"]);
  });

  it("entrada com local atualiza o item; sem local mantem o atual", async () => {
    const s = await createScenario({ stock: 0 });
    const almox = api(s.almox.token);
    const entry = { warehouseId: s.warehouse.id, epiItemId: s.epi.id, quantity: 3 };

    const first = await almox.post("/api/stock/entries").send({ ...entry, location: "Gaveteiro" });
    expect(first.body.location).toBe("Gaveteiro");
    const second = await almox.post("/api/stock/entries").send(entry);
    expect(second.body).toMatchObject({ location: "Gaveteiro", quantity: 6 });
  });

  it("almoxarife de outro almoxarifado nao altera o local (403)", async () => {
    const s = await createScenario();
    const other = await createScenario();

    const res = await api(other.almox.token)
      .patch(`/api/stock/items/${s.stockItem.id}/location`)
      .send({ location: "Invasao" });

    expect(res.status).toBe(403);
    expect(
      (await prisma.stockItem.findUniqueOrThrow({ where: { id: s.stockItem.id } })).location,
    ).toBe("");
  });

  it("recusa local acima do limite", async () => {
    const s = await createScenario();
    const res = await api(s.almox.token)
      .patch(`/api/stock/items/${s.stockItem.id}/location`)
      .send({ location: "x".repeat(61) });
    expect(res.status).toBe(422);
  });
});
