import type {
  createDeliveryRequestSchema,
  DeliveryDto,
  InsufficientStockDetail,
} from "@epi-manager/contracts";
import { Prisma, prisma } from "@epi-manager/database";
import type { z } from "zod";
import { recordAudit } from "../../shared/audit.js";
import { AppError, conflict, notFound } from "../../shared/errors.js";
import type { AuthContext } from "../../shared/http/auth-context.js";
import { assertWarehouseAccess, canAccessBusinessUnit } from "../../shared/http/scope.js";
import { canReceiveEpi } from "../employees/domain/employee-status.js";
import { currentCa } from "../epis/domain/ca.js";
import { insufficientStockError, tryApplyMovement } from "../stock/stock-ledger.js";
import {
  decodeSignaturePng,
  expectedReplacement,
  signatureContentHash,
} from "./domain/signature.js";
import { findDelivery } from "./delivery.queries.js";

type Input = z.output<typeof createDeliveryRequestSchema>;

interface ClientInfo {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface RegisterDeliveryResult {
  delivery: DeliveryDto;
  /** `false` quando a mesma idempotencyKey ja havia sido registrada (reenvio). */
  created: boolean;
}

async function existingByKey(
  input: Input,
  auth: AuthContext,
): Promise<RegisterDeliveryResult | null> {
  const existing = await findDelivery({ idempotencyKey: input.idempotencyKey });
  if (!existing) return null;
  if (existing.deliveredById !== auth.userId) {
    throw conflict("Identificador de entrega ja utilizado");
  }
  return { delivery: existing.dto, created: false };
}

/**
 * Registra uma entrega de EPI. Tudo ou nada, numa unica transacao:
 * entrega + itens (snapshot de nome/CA) + baixa de estoque + movimentacoes + assinatura + auditoria.
 */
export async function registerDelivery(
  input: Input,
  auth: AuthContext,
  client: ClientInfo,
  now: Date = new Date(),
): Promise<RegisterDeliveryResult> {
  const replay = await existingByKey(input, auth);
  if (replay) return replay;

  assertWarehouseAccess(auth, input.warehouseId);

  const employee = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    select: { id: true, name: true, status: true, businessUnitId: true },
  });
  if (!employee || !canAccessBusinessUnit(auth, employee.businessUnitId)) {
    throw notFound("Colaborador nao encontrado");
  }
  if (!canReceiveEpi(employee.status)) {
    throw new AppError(
      "COLABORADOR_INDISPONIVEL",
      422,
      `${employee.name} esta com status ${employee.status} e nao pode receber EPIs.`,
    );
  }

  const stockItems = await prisma.stockItem.findMany({
    where: { id: { in: input.items.map((item) => item.stockItemId) } },
    include: {
      epiItem: {
        select: {
          id: true,
          name: true,
          active: true,
          usefulLifeDays: true,
          cas: { where: { cancelledAt: null } },
        },
      },
    },
  });
  const stockById = new Map(stockItems.map((s) => [s.id, s]));

  const lines = input.items.map((item) => {
    const stock = stockById.get(item.stockItemId);
    if (!stock || stock.warehouseId !== input.warehouseId) {
      throw new AppError(
        "VALIDACAO",
        422,
        "Item de estoque nao pertence ao almoxarifado da entrega.",
        {
          stockItemId: item.stockItemId,
        },
      );
    }
    if (!stock.epiItem.active) {
      throw new AppError(
        "EPI_INATIVO",
        422,
        `${stock.epiItem.name} esta inativo e nao pode ser entregue.`,
      );
    }
    const ca = currentCa(stock.epiItem.cas, now);
    if (!ca) {
      throw new AppError(
        "CA_INVALIDO",
        422,
        `${stock.epiItem.name} nao possui CA vigente. Atualize o CA antes de entregar.`,
      );
    }
    return { request: item, stock, caNumber: ca.number };
  });

  const image = decodeSignaturePng(input.signature);

  try {
    const deliveryId = await prisma.$transaction(
      async (tx) => {
        const delivery = await tx.delivery.create({
          data: {
            idempotencyKey: input.idempotencyKey,
            reason: input.reason,
            reasonDetail: input.reasonDetail,
            notes: input.notes,
            employeeId: employee.id,
            warehouseId: input.warehouseId,
            deliveredById: auth.userId,
            deliveredAt: now,
          },
          select: { id: true, number: true },
        });

        // Ordem fixa de travamento (por stockItemId) evita deadlock entre entregas simultaneas.
        const ordered = [...lines].sort((a, b) => a.stock.id.localeCompare(b.stock.id));
        const shortages: InsufficientStockDetail[] = [];

        for (const line of ordered) {
          const deliveryItem = await tx.deliveryItem.create({
            data: {
              deliveryId: delivery.id,
              epiItemId: line.stock.epiItem.id,
              stockItemId: line.stock.id,
              quantity: line.request.quantity,
              epiName: line.stock.epiItem.name,
              caNumber: line.caNumber,
              size: line.stock.size,
              batchNumber: line.stock.batchNumber,
              notes: line.request.notes,
              expectedReplacementAt: expectedReplacement(now, line.stock.epiItem.usefulLifeDays),
            },
            select: { id: true },
          });
          const movement = await tryApplyMovement(tx, {
            stockItemId: line.stock.id,
            delta: -line.request.quantity,
            type: "ENTREGA",
            reason: `Entrega no ${delivery.number}`,
            performedById: auth.userId,
            deliveryItemId: deliveryItem.id,
          });
          if (!movement) {
            const current = await tx.stockItem.findUniqueOrThrow({
              where: { id: line.stock.id },
              select: { quantity: true },
            });
            shortages.push({
              stockItemId: line.stock.id,
              epiName: line.stock.size
                ? `${line.stock.epiItem.name} (${line.stock.size})`
                : line.stock.epiItem.name,
              requested: line.request.quantity,
              available: current.quantity,
            });
          }
        }
        // Lancar desfaz toda a transacao: nenhuma baixa parcial fica gravada.
        if (shortages.length > 0) throw insufficientStockError(shortages);

        const contentHash = signatureContentHash(
          {
            deliveryId: delivery.id,
            number: delivery.number,
            employeeId: employee.id,
            warehouseId: input.warehouseId,
            deliveredById: auth.userId,
            deliveredAt: now.toISOString(),
            reason: input.reason,
            items: lines.map((line) => ({
              stockItemId: line.stock.id,
              epiItemId: line.stock.epiItem.id,
              caNumber: line.caNumber,
              size: line.stock.size,
              batchNumber: line.stock.batchNumber,
              quantity: line.request.quantity,
            })),
          },
          image,
        );
        await tx.deliverySignature.create({
          data: {
            deliveryId: delivery.id,
            image: new Uint8Array(image),
            imageType: "image/png",
            contentHash,
            signedAt: now,
            ipAddress: client.ipAddress,
            userAgent: client.userAgent,
          },
        });

        await recordAudit(
          {
            userId: auth.userId,
            action: "ENTREGA_REGISTRADA",
            entity: "Delivery",
            entityId: delivery.id,
            after: {
              number: delivery.number,
              employeeId: employee.id,
              warehouseId: input.warehouseId,
              reason: input.reason,
              items: lines.map((l) => ({
                stockItemId: l.stock.id,
                quantity: l.request.quantity,
                caNumber: l.caNumber,
              })),
              contentHash,
            },
            ...client,
          },
          tx,
        );
        return delivery.id;
      },
      { maxWait: 5_000, timeout: 15_000 },
    );

    const delivery = await findDelivery({ id: deliveryId });
    if (!delivery) throw new Error("Entrega registrada nao encontrada");
    return { delivery: delivery.dto, created: true };
  } catch (error) {
    // Reenvio simultaneo com a mesma chave: a outra requisicao venceu; devolve a entrega dela.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const replayed = await existingByKey(input, auth);
      if (replayed) return replayed;
    }
    throw error;
  }
}
