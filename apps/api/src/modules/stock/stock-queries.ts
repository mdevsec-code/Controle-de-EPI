import { Prisma, prisma } from "@epi-manager/database";

/**
 * IDs de itens com saldo abaixo do minimo do EPI. A comparacao entre colunas de tabelas
 * diferentes nao e expressavel no `where` do Prisma, por isso usa SQL (parametrizado).
 */
export async function lowStockItemIds(warehouseIds: string[] | null): Promise<string[]> {
  const scope =
    warehouseIds === null
      ? Prisma.empty
      : Prisma.sql`AND si."warehouse_id" = ANY(${warehouseIds}::text[])`;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT si."id"
      FROM "stock_items" si
      JOIN "epi_items" e ON e."id" = si."epi_item_id"
     WHERE e."active" = true
       AND si."quantity" < e."min_quantity"
       ${scope}`;
  return rows.map((row) => row.id);
}
