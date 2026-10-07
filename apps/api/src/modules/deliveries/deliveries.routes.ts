import {
  createDeliveryRequestSchema,
  createReturnRequestSchema,
  idParamSchema,
  listDeliveriesQuerySchema,
  type DashboardSummaryDto,
  type EpiReturnDto,
} from "@epi-manager/contracts";
import { prisma, type Prisma } from "@epi-manager/database";
import { Router } from "express";
import { recordAudit } from "../../shared/audit.js";
import { AppError, notFound } from "../../shared/errors.js";
import { iso, pageArgs, startOfBusinessDay, toPage } from "../../shared/format.js";
import type { AuthContext } from "../../shared/http/auth-context.js";
import { authenticate, authorize } from "../../shared/http/authenticate.js";
import { actor, authOf, clientInfo, handler } from "../../shared/http/handler.js";
import { canAccessWarehouse, warehouseFilter } from "../../shared/http/scope.js";
import { tryApplyMovement } from "../stock/stock-ledger.js";
import { lowStockItemIds } from "../stock/stock-queries.js";
import { deliveryListInclude, findDelivery, toDeliveryListItem } from "./delivery.queries.js";
import { registerDelivery } from "./register-delivery.js";

const DAY_MS = 86_400_000;
/** Mesmo fuso de startOfBusinessDay (UTC-3). */
const BUSINESS_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Entrega fora do escopo do usuario e tratada como inexistente. */
async function findDeliveryInScope(auth: AuthContext, id: string) {
  const delivery = await findDelivery({ id });
  if (!delivery || !canAccessWarehouse(auth, delivery.warehouseId)) return null;
  return delivery;
}

export function createDeliveriesRouter(): Router {
  const router = Router();
  router.use(["/deliveries", "/dashboard"], authenticate, authorize("ADMIN", "ALMOXARIFADO"));

  router.post(
    "/deliveries",
    handler({ body: createDeliveryRequestSchema }, async ({ body, req, res }) => {
      const result = await registerDelivery(body, authOf(req), clientInfo(req));
      // 201 na criacao; 200 quando e o reenvio de uma entrega ja registrada (idempotencia).
      res.status(result.created ? 201 : 200).json(result.delivery);
    }),
  );

  router.get(
    "/deliveries",
    handler({ query: listDeliveriesQuerySchema }, async ({ query, req }) => {
      const auth = authOf(req);
      if (query.warehouseId && !canAccessWarehouse(auth, query.warehouseId))
        return toPage([], 0, query);
      const where: Prisma.DeliveryWhereInput = {
        warehouseId: query.warehouseId ?? warehouseFilter(auth),
        employeeId: query.employeeId,
        status: query.status,
        deliveredAt: { gte: query.from, lt: query.to },
        ...(query.q
          ? {
              employee: {
                OR: [
                  { name: { contains: query.q, mode: "insensitive" } },
                  { registration: { startsWith: query.q } },
                ],
              },
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.delivery.findMany({
          where,
          include: deliveryListInclude,
          ...pageArgs(query),
          orderBy: { deliveredAt: "desc" },
        }),
        prisma.delivery.count({ where }),
      ]);
      return toPage(items.map(toDeliveryListItem), total, query);
    }),
  );

  router.get(
    "/deliveries/:id",
    handler({ params: idParamSchema }, async ({ params, req }) => {
      const delivery = await findDeliveryInScope(authOf(req), params.id);
      if (!delivery) throw notFound("Entrega nao encontrada");
      return delivery.dto;
    }),
  );

  /** Imagem da assinatura. Servida sempre como PNG validado no registro; nunca em cache compartilhado. */
  router.get(
    "/deliveries/:id/signature",
    handler({ params: idParamSchema }, async ({ params, req, res }) => {
      const delivery = await findDeliveryInScope(authOf(req), params.id);
      const signature =
        delivery &&
        (await prisma.deliverySignature.findUnique({
          where: { deliveryId: params.id },
          select: { image: true },
        }));
      if (!signature) throw notFound("Assinatura nao encontrada");
      res
        .status(200)
        .set({
          "Content-Type": "image/png",
          "Cache-Control": "private, no-store",
          "Content-Security-Policy": "default-src 'none'",
        })
        .send(Buffer.from(signature.image));
    }),
  );

  /**
   * Devolucao (total ou parcial) de um item entregue. Em bom estado volta ao estoque
   * (movimento DEVOLUCAO); danificado/descartado fica so registrado.
   */
  router.post(
    "/deliveries/:id/returns",
    handler(
      { params: idParamSchema, body: createReturnRequestSchema, status: 201 },
      async ({ params, body, req }): Promise<EpiReturnDto> => {
        const auth = authOf(req);
        const delivery = await findDeliveryInScope(auth, params.id);
        if (!delivery) throw notFound("Entrega nao encontrada");
        const item = delivery.dto.items.find((i) => i.id === body.deliveryItemId);
        if (!item) throw notFound("Item nao pertence a esta entrega");

        return prisma.$transaction(
          async (tx) => {
            // Trava o item entregue: devolucoes simultaneas nao ultrapassam o entregue.
            await tx.$queryRaw`SELECT "id" FROM "delivery_items" WHERE "id" = ${item.id} FOR UPDATE`;
            const returned = await tx.epiReturn.aggregate({
              where: { deliveryItemId: item.id },
              _sum: { quantity: true },
            });
            const pending = item.quantity - (returned._sum.quantity ?? 0);
            if (body.quantity > pending) {
              throw new AppError(
                "DEVOLUCAO_EXCEDE_ENTREGUE",
                422,
                `So ha ${pending} unidade(s) de ${item.epiName} pendente(s) de devolucao.`,
                { pending },
              );
            }

            const stockItem = await tx.deliveryItem.findUniqueOrThrow({
              where: { id: item.id },
              select: { stockItemId: true },
            });
            const restock = body.condition === "BOM";
            const created = await tx.epiReturn.create({
              data: {
                deliveryItemId: item.id,
                quantity: body.quantity,
                condition: body.condition,
                reason: body.reason,
                stockItemId: restock ? stockItem.stockItemId : null,
                receivedById: auth.userId,
              },
            });
            if (restock) {
              await tryApplyMovement(tx, {
                stockItemId: stockItem.stockItemId,
                delta: body.quantity,
                type: "DEVOLUCAO",
                reason: `Devolucao da entrega no ${delivery.dto.number}`,
                performedById: auth.userId,
                returnId: created.id,
              });
            }
            await recordAudit(
              {
                ...actor(req),
                action: "DEVOLUCAO_REGISTRADA",
                entity: "EpiReturn",
                entityId: created.id,
                after: created,
              },
              tx,
            );
            return {
              id: created.id,
              deliveryItemId: created.deliveryItemId,
              quantity: created.quantity,
              condition: created.condition,
              reason: created.reason,
              restocked: restock,
              returnedAt: iso(created.returnedAt),
            };
          },
          { maxWait: 5_000, timeout: 15_000 },
        );
      },
    ),
  );

  /** Resumo do dia (horario de Brasilia) para a tela inicial do almoxarifado. */
  router.get(
    "/dashboard/summary",
    handler({}, async ({ req }): Promise<DashboardSummaryDto> => {
      const auth = authOf(req);
      const warehouseId = warehouseFilter(auth);
      const todayStart = startOfBusinessDay();
      const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS);
      const today: Prisma.DeliveryWhereInput = {
        warehouseId,
        status: "CONCLUIDA",
        deliveredAt: { gte: todayStart },
      };
      const [deliveries, employees, epiTypes, lowStock, recent, weekRows, unplaced] =
        await Promise.all([
          prisma.delivery.count({ where: today }),
          prisma.delivery.groupBy({ by: ["employeeId"], where: today }),
          prisma.deliveryItem.groupBy({ by: ["epiItemId"], where: { delivery: today } }),
          lowStockItemIds(auth.warehouseIds),
          prisma.delivery.findMany({
            where: { warehouseId },
            include: deliveryListInclude,
            orderBy: { deliveredAt: "desc" },
            take: 5,
          }),
          prisma.delivery.findMany({
            where: { warehouseId, status: "CONCLUIDA", deliveredAt: { gte: weekStart } },
            select: { deliveredAt: true },
          }),
          prisma.stockItem.count({ where: { warehouseId, location: "", quantity: { gt: 0 } } }),
        ]);
      const week = Array.from({ length: 7 }, (_, i) => ({
        // Data local (UTC-3) do dia, no formato AAAA-MM-DD.
        date: new Date(weekStart.getTime() + i * DAY_MS - BUSINESS_OFFSET_MS)
          .toISOString()
          .slice(0, 10),
        deliveries: 0,
      }));
      for (const row of weekRows) {
        const day = week[Math.floor((row.deliveredAt.getTime() - weekStart.getTime()) / DAY_MS)];
        if (day) day.deliveries += 1;
      }
      return {
        today: { deliveries, employeesServed: employees.length, epiTypes: epiTypes.length },
        lowStockCount: lowStock.length,
        unplacedStockCount: unplaced,
        week,
        recentDeliveries: recent.map(toDeliveryListItem),
      };
    }),
  );

  return router;
}
