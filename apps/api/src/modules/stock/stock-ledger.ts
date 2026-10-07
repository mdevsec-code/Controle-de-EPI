import type { InsufficientStockDetail, StockMovementType } from "@epi-manager/contracts";
import type { Tx } from "@epi-manager/database";
import { AppError, notFound } from "../../shared/errors.js";

/**
 * Razao de estoque: UNICO ponto do sistema que altera `stock_items.quantity`.
 *
 * Concorrencia: a baixa e um UPDATE condicional (`... WHERE quantity >= n RETURNING quantity`).
 * O PostgreSQL trava a linha durante o UPDATE e reavalia a condicao apos a espera, entao duas
 * baixas simultaneas nunca deixam o saldo negativo — a segunda simplesmente nao encontra saldo.
 * O CHECK (quantity >= 0) da migration e a rede de seguranca caso algo escape desta regra.
 * O frontend nunca envia saldo calculado; envia apenas a quantidade da operacao.
 */

export interface MovementInput {
  stockItemId: string;
  /** Variacao assinada: negativa para saidas. */
  delta: number;
  type: StockMovementType;
  reason?: string | null;
  performedById: string;
  deliveryItemId?: string;
  returnId?: string;
}

export interface MovementResult {
  movementId: string;
  balanceBefore: number;
  balanceAfter: number;
}

export function insufficientStockError(details: InsufficientStockDetail[]): AppError {
  const message =
    details.length === 1 && details[0]
      ? `Estoque insuficiente para ${details[0].epiName}: solicitado ${details[0].requested}, disponivel ${details[0].available}.`
      : "Estoque insuficiente para alguns EPIs.";
  return new AppError("ESTOQUE_INSUFICIENTE", 409, message, details);
}

/** Tenta aplicar a variacao; devolve `null` se a baixa nao couber no saldo (sem lancar). */
export async function tryApplyMovement(
  tx: Tx,
  input: MovementInput,
): Promise<MovementResult | null> {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new Error(`delta invalido: ${input.delta}`);
  }

  const rows =
    input.delta < 0
      ? await tx.$queryRaw<{ quantity: number }[]>`
          UPDATE "stock_items"
             SET "quantity" = "quantity" + ${input.delta}, "updated_at" = now()
           WHERE "id" = ${input.stockItemId} AND "quantity" >= ${-input.delta}
       RETURNING "quantity"`
      : await tx.$queryRaw<{ quantity: number }[]>`
          UPDATE "stock_items"
             SET "quantity" = "quantity" + ${input.delta}, "updated_at" = now()
           WHERE "id" = ${input.stockItemId}
       RETURNING "quantity"`;

  const row = rows[0];
  if (!row) {
    if (input.delta > 0) throw notFound("Item de estoque nao encontrado");
    return null;
  }

  const balanceAfter = Number(row.quantity);
  const balanceBefore = balanceAfter - input.delta;
  const movement = await tx.stockMovement.create({
    data: {
      stockItemId: input.stockItemId,
      type: input.type,
      delta: input.delta,
      balanceBefore,
      balanceAfter,
      reason: input.reason ?? null,
      performedById: input.performedById,
      deliveryItemId: input.deliveryItemId,
      returnId: input.returnId,
    },
    select: { id: true },
  });
  return { movementId: movement.id, balanceBefore, balanceAfter };
}

/** Saldo atual travando a linha ate o fim da transacao (usado no ajuste de inventario). */
export async function lockStockItem(tx: Tx, stockItemId: string): Promise<number> {
  const rows = await tx.$queryRaw<{ quantity: number }[]>`
    SELECT "quantity" FROM "stock_items" WHERE "id" = ${stockItemId} FOR UPDATE`;
  const row = rows[0];
  if (!row) throw notFound("Item de estoque nao encontrado");
  return Number(row.quantity);
}

export async function currentQuantity(tx: Tx, stockItemId: string): Promise<number> {
  const item = await tx.stockItem.findUnique({
    where: { id: stockItemId },
    select: { quantity: true },
  });
  return item?.quantity ?? 0;
}
