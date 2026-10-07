import {
  idParamSchema,
  listMovementsQuerySchema,
  listStockQuerySchema,
  stockAdjustmentRequestSchema,
  stockEntryRequestSchema,
  stockLocationsQuerySchema,
  updateStockLocationRequestSchema,
  type StockItemDto,
  type StockMovementDto,
} from "@epi-manager/contracts";
import { prisma, type Prisma } from "@epi-manager/database";
import { Router } from "express";
import { recordAudit } from "../../shared/audit.js";
import { notFound, unprocessable } from "../../shared/errors.js";
import { iso, pageArgs, toPage } from "../../shared/format.js";
import { authenticate, authorize } from "../../shared/http/authenticate.js";
import { actor, authOf, handler } from "../../shared/http/handler.js";
import { assertWarehouseAccess, warehouseFilter } from "../../shared/http/scope.js";
import { currentCa } from "../epis/domain/ca.js";
import { insufficientStockError, lockStockItem, tryApplyMovement } from "./stock-ledger.js";
import { lowStockItemIds } from "./stock-queries.js";

export const stockItemInclude = {
  warehouse: { select: { name: true } },
  epiItem: {
    select: {
      name: true,
      model: true,
      internalCode: true,
      minQuantity: true,
      active: true,
      usefulLifeDays: true,
      category: { select: { name: true } },
      cas: { where: { cancelledAt: null } },
    },
  },
} satisfies Prisma.StockItemInclude;

export type StockItemRow = Prisma.StockItemGetPayload<{ include: typeof stockItemInclude }>;

export function toStockItemDto(s: StockItemRow, now = new Date()): StockItemDto {
  return {
    id: s.id,
    warehouseId: s.warehouseId,
    warehouseName: s.warehouse.name,
    epiItemId: s.epiItemId,
    epiName: s.epiItem.name,
    model: s.epiItem.model,
    internalCode: s.epiItem.internalCode,
    categoryName: s.epiItem.category.name,
    size: s.size,
    batchNumber: s.batchNumber,
    location: s.location,
    quantity: s.quantity,
    minQuantity: s.epiItem.minQuantity,
    caNumber: currentCa(s.epiItem.cas, now)?.number ?? null,
  };
}

const movementInclude = {
  performedBy: { select: { name: true } },
  stockItem: {
    select: {
      size: true,
      batchNumber: true,
      epiItem: { select: { name: true } },
      warehouse: { select: { name: true } },
    },
  },
  deliveryItem: { select: { delivery: { select: { id: true, number: true } } } },
} satisfies Prisma.StockMovementInclude;

function toMovementDto(
  m: Prisma.StockMovementGetPayload<{ include: typeof movementInclude }>,
): StockMovementDto {
  return {
    id: m.id,
    type: m.type,
    delta: m.delta,
    balanceBefore: m.balanceBefore,
    balanceAfter: m.balanceAfter,
    reason: m.reason,
    performedByName: m.performedBy.name,
    createdAt: iso(m.createdAt),
    stockItemId: m.stockItemId,
    epiName: m.stockItem.epiItem.name,
    size: m.stockItem.size,
    batchNumber: m.stockItem.batchNumber,
    warehouseName: m.stockItem.warehouse.name,
    deliveryId: m.deliveryItem?.delivery.id ?? null,
    deliveryNumber: m.deliveryItem?.delivery.number ?? null,
  };
}

const TX_OPTIONS = { maxWait: 5_000, timeout: 15_000 };

export function createStockRouter(): Router {
  const router = Router();
  router.use("/stock", authenticate, authorize("ADMIN", "ALMOXARIFADO"));

  /** Saldos por almoxarifado x EPI x tamanho x lote, restritos aos almoxarifados do usuario. */
  router.get(
    "/stock/items",
    handler({ query: listStockQuerySchema }, async ({ query, req }) => {
      const auth = authOf(req);
      if (query.warehouseId) assertWarehouseAccess(auth, query.warehouseId);

      const where: Prisma.StockItemWhereInput = {
        warehouseId: query.warehouseId ?? warehouseFilter(auth),
        epiItemId: query.epiItemId,
        ...(query.available ? { quantity: { gt: 0 }, epiItem: { active: true } } : {}),
        ...(query.lowStock ? { id: { in: await lowStockItemIds(auth.warehouseIds) } } : {}),
        // Busca por nome/codigo do EPI ou pelo local onde esta guardado.
        ...(query.q
          ? {
              OR: [
                { epiItem: { name: { contains: query.q, mode: "insensitive" } } },
                { epiItem: { internalCode: { contains: query.q, mode: "insensitive" } } },
                { location: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.stockItem.findMany({
          where,
          include: stockItemInclude,
          ...pageArgs(query),
          orderBy: [{ epiItem: { name: "asc" } }, { size: "asc" }, { batchNumber: "asc" }],
        }),
        prisma.stockItem.count({ where }),
      ]);
      const now = new Date();
      return toPage(
        items.map((item) => toStockItemDto(item, now)),
        total,
        query,
      );
    }),
  );

  /** Entrada de material. Cria o item (EPI x tamanho x lote) no almoxarifado se ainda nao existir. */
  router.post(
    "/stock/entries",
    handler({ body: stockEntryRequestSchema, status: 201 }, async ({ body, req }) => {
      const auth = authOf(req);
      assertWarehouseAccess(auth, body.warehouseId);
      const epi = await prisma.epiItem.findUnique({
        where: { id: body.epiItemId },
        select: { active: true },
      });
      if (!epi) throw unprocessable("NAO_ENCONTRADO", "EPI informado nao existe");
      if (
        !(await prisma.warehouse.findUnique({
          where: { id: body.warehouseId },
          select: { id: true },
        }))
      ) {
        throw unprocessable("NAO_ENCONTRADO", "Almoxarifado informado nao existe");
      }

      const stockItemId = await prisma.$transaction(async (tx) => {
        const key = {
          warehouseId: body.warehouseId,
          epiItemId: body.epiItemId,
          size: body.size,
          batchNumber: body.batchNumber,
        };
        const item = await tx.stockItem.upsert({
          where: { warehouseId_epiItemId_size_batchNumber: key },
          create: { ...key, location: body.location ?? "" },
          update: body.location === undefined ? {} : { location: body.location },
          select: { id: true },
        });
        const result = await tryApplyMovement(tx, {
          stockItemId: item.id,
          delta: body.quantity,
          type: "ENTRADA",
          reason: body.reason,
          performedById: auth.userId,
        });
        await recordAudit(
          {
            ...actor(req),
            action: "ESTOQUE_ENTRADA",
            entity: "StockItem",
            entityId: item.id,
            after: { ...key, ...result, quantity: body.quantity, location: body.location },
          },
          tx,
        );
        return item.id;
      }, TX_OPTIONS);

      const item = await prisma.stockItem.findUniqueOrThrow({
        where: { id: stockItemId },
        include: stockItemInclude,
      });
      return toStockItemDto(item);
    }),
  );

  /** Saida avulsa, perda, avaria ou ajuste de inventario (saldo contado). */
  router.post(
    "/stock/adjustments",
    handler({ body: stockAdjustmentRequestSchema, status: 201 }, async ({ body, req }) => {
      const auth = authOf(req);
      const existing = await prisma.stockItem.findUnique({
        where: { id: body.stockItemId },
        select: { warehouseId: true, epiItem: { select: { name: true } } },
      });
      if (!existing) throw notFound("Item de estoque nao encontrado");
      assertWarehouseAccess(auth, existing.warehouseId);

      await prisma.$transaction(async (tx) => {
        let delta: number;
        if (body.type === "AJUSTE") {
          const current = await lockStockItem(tx, body.stockItemId);
          delta = body.countedQuantity - current;
          if (delta === 0) {
            throw unprocessable(
              "VALIDACAO",
              "O saldo contado e igual ao saldo atual; nada a ajustar.",
            );
          }
        } else {
          delta = -body.quantity;
        }

        const result = await tryApplyMovement(tx, {
          stockItemId: body.stockItemId,
          delta,
          type: body.type,
          reason: body.reason,
          performedById: auth.userId,
        });
        if (!result) {
          const available = await tx.stockItem.findUniqueOrThrow({
            where: { id: body.stockItemId },
            select: { quantity: true },
          });
          throw insufficientStockError([
            {
              stockItemId: body.stockItemId,
              epiName: existing.epiItem.name,
              requested: -delta,
              available: available.quantity,
            },
          ]);
        }
        await recordAudit(
          {
            ...actor(req),
            action: "ESTOQUE_AJUSTE",
            entity: "StockItem",
            entityId: body.stockItemId,
            after: { type: body.type, delta, reason: body.reason, ...result },
          },
          tx,
        );
      }, TX_OPTIONS);

      const item = await prisma.stockItem.findUniqueOrThrow({
        where: { id: body.stockItemId },
        include: stockItemInclude,
      });
      return toStockItemDto(item);
    }),
  );

  /** Define ou limpa o local de armazenamento (nao mexe no saldo; fica na auditoria). */
  router.patch(
    "/stock/items/:id/location",
    handler(
      { params: idParamSchema, body: updateStockLocationRequestSchema },
      async ({ params, body, req }) => {
        const auth = authOf(req);
        const before = await prisma.stockItem.findUnique({
          where: { id: params.id },
          select: { warehouseId: true, location: true },
        });
        if (!before) throw notFound("Item de estoque nao encontrado");
        assertWarehouseAccess(auth, before.warehouseId);

        const item = await prisma.$transaction(async (tx) => {
          const updated = await tx.stockItem.update({
            where: { id: params.id },
            data: { location: body.location },
            include: stockItemInclude,
          });
          await recordAudit(
            {
              ...actor(req),
              action: "ATUALIZAR",
              entity: "StockItem",
              entityId: params.id,
              before: { location: before.location },
              after: { location: body.location },
            },
            tx,
          );
          return updated;
        });
        return toStockItemDto(item);
      },
    ),
  );

  /** Locais ja usados no almoxarifado (sugestoes no cadastro e filtro da tela de estoque). */
  router.get(
    "/stock/locations",
    handler({ query: stockLocationsQuerySchema }, async ({ query, req }) => {
      assertWarehouseAccess(authOf(req), query.warehouseId);
      const rows = await prisma.stockItem.findMany({
        where: { warehouseId: query.warehouseId, location: { not: "" } },
        distinct: ["location"],
        select: { location: true },
        orderBy: { location: "asc" },
      });
      return rows.map((row) => row.location);
    }),
  );

  /** Historico de movimentacoes: explica como cada saldo foi formado. */
  router.get(
    "/stock/movements",
    handler({ query: listMovementsQuerySchema }, async ({ query, req }) => {
      const auth = authOf(req);
      if (query.warehouseId) assertWarehouseAccess(auth, query.warehouseId);
      const where: Prisma.StockMovementWhereInput = {
        stockItemId: query.stockItemId,
        type: query.type,
        createdAt: { gte: query.from, lte: query.to },
        stockItem: {
          warehouseId: query.warehouseId ?? warehouseFilter(auth),
          epiItemId: query.epiItemId,
        },
      };
      const [items, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where,
          include: movementInclude,
          ...pageArgs(query),
          orderBy: { createdAt: "desc" },
        }),
        prisma.stockMovement.count({ where }),
      ]);
      return toPage(items.map(toMovementDto), total, query);
    }),
  );

  return router;
}
